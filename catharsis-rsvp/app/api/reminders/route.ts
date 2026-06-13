import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Event date/time info
// June 25, 2026 — sessions run from 6:30 PM to ~10:15 PM PT (UTC-7)
// First session starts at 2026-06-26T01:30:00Z
// Last session starts at 2026-06-26T04:50:00Z

function parseSlotToUtc(timeSlot: string): Date {
  const [time, period] = timeSlot.split(' ')
  const [hourStr, minuteStr] = time.split(':')
  let hour = parseInt(hourStr)
  const minute = parseInt(minuteStr)
  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0
  // June 25, 2026 PT = UTC-7
  return new Date(`2026-06-25T${String(hour + 7).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`)
}

function buildReminderEmail(
  firstName: string,
  timeSlot: string,
  cancelUrl: string,
  isClose: boolean,
) {
  const timing = isClose ? 'Your session is in 12 hours' : 'Your session is tomorrow'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reminder — Catharsis Soundrooms</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <tr>
            <td style="padding-bottom:32px;text-align:center;border-bottom:1px solid #c8bdb2;">
              <p style="margin:0;font-size:10px;letter-spacing:0.25em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">Catharsis Soundrooms</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 0 16px;text-align:center;">
              <p style="margin:0 0 24px;font-size:11px;letter-spacing:0.15em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">${timing}</p>
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:300;font-style:italic;color:#2a2a2a;line-height:1.15;font-family:Georgia,serif;">Where They Don&rsquo;t<br/>Make Roads</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#7a6e66;font-family:Georgia,serif;">Micah Peay</p>
            </td>
          </tr>

          <tr>
            <td style="border-top:1px solid #c8bdb2;border-bottom:1px solid #c8bdb2;padding:28px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:14px;">
                    <span style="font-size:10px;letter-spacing:0.12em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">Session</span>
                    <span style="float:right;font-size:14px;color:#2a2a2a;font-family:Georgia,serif;">${timeSlot}, June 25th</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="font-size:10px;letter-spacing:0.12em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">Location</span>
                    <span style="float:right;font-size:14px;color:#2a2a2a;font-family:Georgia,serif;">2100 Zeno Pl, Venice</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 0;text-align:center;">
              <p style="margin:0;font-size:13px;color:#5a5048;line-height:1.9;font-family:Georgia,serif;">
                Please arrive 10 minutes before your session, ${firstName}.<br/>
                Once started, the experience cannot be interrupted.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:24px;border-top:1px solid #c8bdb2;text-align:center;">
              <a href="${cancelUrl}" style="font-size:11px;letter-spacing:0.15em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">Cancel my reservation</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron (or manually with the secret)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const supabaseAdmin = getSupabaseAdmin()

  const { data: rsvps, error } = await supabaseAdmin
    .from('rsvps')
    .select('*')
    .eq('cancelled', false)

  if (error) {
    console.error('Reminder fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = { twoDaysSent: 0, twelveHoursSent: 0, skipped: 0, errors: 0 }

  for (const rsvp of rsvps ?? []) {
    try {
      const slotTime = parseSlotToUtc(rsvp.time_slot)
      const msUntilSlot = slotTime.getTime() - now.getTime()
      const hoursUntilSlot = msUntilSlot / (1000 * 60 * 60)

      const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel?token=${rsvp.cancel_token}`

      // 2-day reminder: between 47h and 49h before slot
      if (hoursUntilSlot >= 47 && hoursUntilSlot < 49) {
        await resend.emails.send({
          from: 'Catharsis Soundrooms <onboarding@resend.dev>',
          to: rsvp.email,
          subject: `Tomorrow — ${rsvp.time_slot}, June 25th`,
          html: buildReminderEmail(rsvp.first_name, rsvp.time_slot, cancelUrl, false),
        })
        results.twoDaysSent++
      }
      // 12-hour reminder: between 11.5h and 12.5h before slot
      else if (hoursUntilSlot >= 11.5 && hoursUntilSlot < 12.5) {
        await resend.emails.send({
          from: 'Catharsis Soundrooms <onboarding@resend.dev>',
          to: rsvp.email,
          subject: `Tonight — ${rsvp.time_slot}, June 25th`,
          html: buildReminderEmail(rsvp.first_name, rsvp.time_slot, cancelUrl, true),
        })
        results.twelveHoursSent++
      } else {
        results.skipped++
      }
    } catch (err) {
      console.error(`Reminder error for rsvp ${rsvp.id}:`, err)
      results.errors++
    }
  }

  return NextResponse.json({ success: true, ...results })
}
