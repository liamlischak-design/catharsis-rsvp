import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { TIME_SLOTS } from '@/lib/constants'
async function sendEmail(to: string, subject: string, html: string, attachments?: { filename: string; path: string }[]) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Catharsis Soundrooms <hello@catharsissoundrooms.com>',
      to,
      subject,
      html,
      ...(attachments ? { attachments } : {}),
    }),
  })
}

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
  const pad = (n: number) => String(n).padStart(2, '0')
  // Use -07:00 offset so JS handles the midnight UTC rollover correctly
  return new Date(`2026-06-25T${pad(hour)}:${pad(minute)}:00-07:00`)
}

function buildReminderEmail(
  firstName: string,
  timeSlot: string,
  cancelUrl: string,
  isClose: boolean,
) {
  const timing = isClose ? `Album Experience Tonight, ${firstName}!` : `Album Experience Tomorrow, ${firstName}!`
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
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.25em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">Catharsis Soundrooms</p>
              <p style="margin:0;font-size:11px;letter-spacing:0.2em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">@ Satellite One</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 0 16px;text-align:center;">
              <p style="margin:0 0 24px;font-size:14px;letter-spacing:0.12em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">${timing}</p>
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:300;font-style:italic;color:#2a2a2a;line-height:1.15;font-family:Georgia,serif;">Where They Don&rsquo;t<br/>Make Roads</h1>
              <p style="margin:0;font-size:13px;font-weight:300;color:#7a6e66;letter-spacing:0.08em;font-family:Georgia,serif;text-transform:uppercase;">Artist: Micah Peay</p>
            </td>
          </tr>

          <tr>
            <td style="border-top:1px solid #c8bdb2;border-bottom:1px solid #c8bdb2;padding:28px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:14px;">
                    <span style="font-size:10px;letter-spacing:0.12em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">Time</span>
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
            <td style="padding:24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 24px;border:1px solid #2a2a2a;background:#ffffff;text-align:center;">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.15em;color:#2a2a2a;text-transform:uppercase;font-family:Georgia,serif;">Important Reminder</p>
                    <p style="margin:0;font-size:13px;color:#2a2a2a;line-height:1.9;font-family:Georgia,serif;">
                      Please arrive 10 minutes before your session, and allow time for street parking in the area. If you are late, the experience may begin without you and cannot be interrupted.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px;border:1px solid #cc4444;background:#fff5f5;text-align:center;margin-top:32px;">
              <p style="margin:0 0 16px;font-size:13px;color:#8a7d74;line-height:1.8;font-family:Georgia,serif;">If you need to cancel your reservation, please let us know so we can give it to someone on our waitlist! Space is limited.</p>
              <a href="${cancelUrl}" style="display:inline-block;padding:12px 32px;border:1px solid #cc4444;background:#cc4444;font-size:11px;letter-spacing:0.2em;color:#ffffff;text-decoration:none;text-transform:uppercase;font-family:Georgia,serif;">Cancel my reservation</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildCapacityWaitlistEmail(firstName: string, timeSlot: string, claimUrl: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A spot is yours</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <tr>
            <td style="padding-bottom:40px;text-align:center;border-bottom:1px solid #c8bdb2;">
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.25em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">Catharsis Soundrooms @ Satellite One</p>
              <p style="margin:0;font-size:10px;letter-spacing:0.15em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">Presents</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 0 32px;text-align:center;">
              <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.15em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">A spot opened up for you, \${firstName}</p>
              <h1 style="margin:0 0 8px;font-size:32px;font-weight:300;font-style:italic;color:#2a2a2a;line-height:1.15;font-family:Georgia,serif;">Where They Don&rsquo;t<br/>Make Roads</h1>
              <p style="margin:0;font-size:13px;font-weight:300;color:#7a6e66;letter-spacing:0.08em;font-family:Georgia,serif;text-transform:uppercase;">Artist: Micah Peay</p>
            </td>
          </tr>

          <tr>
            <td style="border-top:1px solid #c8bdb2;border-bottom:1px solid #c8bdb2;padding:28px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:14px;">
                    <span style="font-size:10px;letter-spacing:0.12em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">Time</span>
                    <span style="float:right;font-size:14px;color:#2a2a2a;font-family:Georgia,serif;">\${timeSlot}, June 25th</span>
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
              <p style="margin:0 0 24px;font-size:13px;color:#5a5048;line-height:1.9;font-family:Georgia,serif;">
                You have until tomorrow to claim your spot.<br/>
                After that, it will be offered to the next person on the waitlist.
              </p>
              <a href="${claimUrl}" style="display:inline-block;padding:16px 40px;background:#2a2a2a;color:#f5f0eb;font-size:11px;letter-spacing:0.2em;text-decoration:none;text-transform:uppercase;font-family:Georgia,serif;">Claim My Spot</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function checkCapacityAndNotifyWaitlist(supabaseAdmin: any) {
  const results = { waitlistNotified: 0, waitlistSkipped: 0 }

  for (const slot of TIME_SLOTS) {
    // Count current confirmed bookings
    const { count: bookedCount } = await supabaseAdmin
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('time_slot', slot.id)
      .eq('cancelled', false)

    const openSpots = slot.capacity - (bookedCount ?? 0)
    if (openSpots <= 0) continue

    // Get waitlist entries that haven't been notified yet for this slot
    const { data: waitlistEntries } = await supabaseAdmin
      .from('waitlist')
      .select('*')
      .eq('time_slot', slot.id)
      .eq('claimed', false)
      .eq('cancelled', false)
      .is('notified_at', null)
      .order('created_at', { ascending: true })
      .limit(openSpots)

    if (!waitlistEntries || waitlistEntries.length === 0) continue

    const now = new Date()
    const expires = new Date(now.getTime() + 23 * 60 * 60 * 1000)

    for (const entry of waitlistEntries) {
      // Check they don't already have an RSVP
      const { data: existingRsvp } = await supabaseAdmin
        .from('rsvps')
        .select('id')
        .eq('email', entry.email)
        .eq('cancelled', false)
        .single()

      if (existingRsvp) {
        // Already booked — mark as cancelled
        await supabaseAdmin.from('waitlist').update({ cancelled: true }).eq('id', entry.id)
        results.waitlistSkipped++
        continue
      }

      // Set 6-hour claim window
      await supabaseAdmin
        .from('waitlist')
        .update({
          notified_at: now.toISOString(),
          notified_expires_at: expires.toISOString(),
        })
        .eq('id', entry.id)

      const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/claim?waitlist_id=${entry.id}`

      await sendEmail(
        entry.email,
        `A spot opened up — ${slot.id}, June 25th`,
        buildCapacityWaitlistEmail(entry.first_name, slot.id, claimUrl),
      )

      results.waitlistNotified++
    }
  }

  return results
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

      // 1-day reminder: fires at 10am PT June 24th (32-36h before all sessions)
      if (hoursUntilSlot >= 32 && hoursUntilSlot < 36) {
        await sendEmail(
          rsvp.email,
          `Album Experience Tomorrow @ ${rsvp.time_slot}, June 25th`,
          buildReminderEmail(rsvp.first_name, rsvp.time_slot, cancelUrl, false),
          [{ filename: 'MicahPeayAlbumExperience.png', path: 'https://catharsissoundrooms.com/MicahPeayAlbumExperience.png' }]
        )
        results.twoDaysSent++
      }
      // Day-of reminder: fires at 10am PT June 25th (8-12.5h before all sessions)
      else if (hoursUntilSlot >= 8 && hoursUntilSlot < 12.5) {
        await sendEmail(
          rsvp.email,
          `Album Experience Tonight @ ${rsvp.time_slot}, June 25th`,
          buildReminderEmail(rsvp.first_name, rsvp.time_slot, cancelUrl, true),
          [{ filename: 'MicahPeayAlbumExperience.png', path: 'https://catharsissoundrooms.com/MicahPeayAlbumExperience.png' }]
        )
        results.twelveHoursSent++
      } else {
        results.skipped++
      }
    } catch (err) {
      console.error(`Reminder error for rsvp ${rsvp.id}:`, err)
      results.errors++
    }
  }

  // Check for capacity increases and notify waitlist
  const waitlistResults = await checkCapacityAndNotifyWaitlist(supabaseAdmin)

  return NextResponse.json({ success: true, ...results, ...waitlistResults })
}
