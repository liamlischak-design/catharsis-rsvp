import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { TIME_SLOTS, EVENT } from '@/lib/constants'
async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Catharsis Soundrooms <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  })
}

function buildCalendarLinks(timeSlot: string) {
  // Event is June 25, 2026 in Los Angeles (PT = UTC-7 in June)
  const [time, period] = timeSlot.split(' ')
  const [hourStr, minuteStr] = time.split(':')
  let hour = parseInt(hourStr)
  const minute = parseInt(minuteStr)
  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0

  // UTC times (PT is UTC-7)
  const utcHour = hour + 7
  const endTotalMinutes = minute + 30
  const endHour = utcHour + Math.floor(endTotalMinutes / 60)
  const endMinute = endTotalMinutes % 60

  const pad = (n: number) => String(n).padStart(2, '0')
  const startUtc = `20260625T${pad(utcHour)}${pad(minute)}00Z`
  const endUtc = `20260625T${pad(endHour)}${pad(endMinute)}00Z`

  // For Google Calendar
  const title = encodeURIComponent(`${EVENT.name} — ${EVENT.presenter}`)
  const details = encodeURIComponent(`An immersive listening experience by ${EVENT.artist}`)
  const location = encodeURIComponent(EVENT.address)
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}`

  // For Apple Calendar — ICS with timezone
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART;TZID=America/Los_Angeles:20260625T${pad(hour)}${pad(minute)}00`,
    `DTEND;TZID=America/Los_Angeles:20260625T${pad(hour + Math.floor(endTotalMinutes / 60))}${pad(endTotalMinutes % 60)}00`,
    `SUMMARY:${EVENT.name} — ${EVENT.presenter}`,
    `DESCRIPTION:An immersive listening experience by ${EVENT.artist}`,
    `LOCATION:${EVENT.address}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const icsDataUri = `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`

  // For Outlook
  const startIso = new Date(`2026-06-25T${pad(hour)}:${pad(minute)}:00-07:00`).toISOString()
  const endIso = new Date(`2026-06-25T${pad(hour + Math.floor(endTotalMinutes / 60))}:${pad(endTotalMinutes % 60)}:00-07:00`).toISOString()
  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startIso}&enddt=${endIso}&location=${location}&body=${details}`

  return { google, ics: icsDataUri, outlook }
}

function buildConfirmationEmail(
  firstName: string,
  timeSlot: string,
  cancelUrl: string,
) {
  const cal = buildCalendarLinks(timeSlot)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:40px;text-align:center;border-bottom:1px solid #c8bdb2;">
              <p style="margin:0 0 20px;font-size:15px;letter-spacing:0.25em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">Catharsis Soundrooms</p>
              <p style="margin:0;font-size:15px;letter-spacing:0.15em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">Presents</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:40px 0 32px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:32px;font-weight:300;font-style:italic;color:#2a2a2a;line-height:1.15;font-family:Georgia,serif;">Where They Don&rsquo;t Make Roads</h1>
              <p style="margin:0;font-size:14px;font-weight:300;color:#9a8d84;letter-spacing:0.08em;font-family:Georgia,serif;font-style:italic;">A New Album by <span style="font-weight:700;font-style:normal;color:#7a6e66;">Micah Peay</span></p>
            </td>
          </tr>

          <!-- Confirmation line -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:0.15em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">You are confirmed, ${firstName}</p>
            </td>
          </tr>

          <!-- Details -->
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
                  <td style="padding-bottom:14px;">
                    <span style="font-size:10px;letter-spacing:0.12em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">Location</span>
                    <span style="float:right;font-size:14px;color:#2a2a2a;text-align:right;font-family:Georgia,serif;">2100 Zeno Pl<br/>Venice, CA 90291</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="font-size:10px;letter-spacing:0.12em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">Duration</span>
                    <span style="float:right;font-size:14px;color:#2a2a2a;font-family:Georgia,serif;">~25 minutes</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding:32px 0;text-align:center;">
              <p style="margin:0;font-size:13px;color:#5a5048;line-height:1.9;letter-spacing:0.03em;font-family:Georgia,serif;">
                Please arrive 10 minutes before your session.<br/>
                Once started, the experience cannot be interrupted.
              </p>
            </td>
          </tr>

          <!-- Add to Calendar -->
          <tr>
            <td style="padding:28px 0;text-align:center;background:#2a2a2a;">
              <p style="margin:0 0 20px;font-size:11px;letter-spacing:0.2em;color:#c8bdb2;text-transform:uppercase;font-family:Georgia,serif;">Add to your calendar</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 6px;">
                    <a href="${cal.google}" target="_blank" style="display:inline-block;padding:12px 22px;border:1px solid #c8bdb2;font-size:11px;letter-spacing:0.15em;color:#f5f0eb;text-decoration:none;text-transform:uppercase;font-family:Georgia,serif;">Google</a>
                  </td>
                  <td style="padding:0 6px;">
                    <a href="${cal.ics}" target="_blank" style="display:inline-block;padding:12px 22px;border:1px solid #c8bdb2;font-size:11px;letter-spacing:0.15em;color:#f5f0eb;text-decoration:none;text-transform:uppercase;font-family:Georgia,serif;">Apple</a>
                  </td>
                  <td style="padding:0 6px;">
                    <a href="${cal.outlook}" target="_blank" style="display:inline-block;padding:12px 22px;border:1px solid #c8bdb2;font-size:11px;letter-spacing:0.15em;color:#f5f0eb;text-decoration:none;text-transform:uppercase;font-family:Georgia,serif;">Outlook</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cancel -->
          <tr>
            <td style="padding:32px 28px;text-align:center;border:1px solid #c8bdb2;margin-top:32px;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.2em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">Need to cancel?</p>
              <p style="margin:0 0 24px;font-size:13px;color:#8a7d74;line-height:1.8;font-family:Georgia,serif;">
                Plans change — we understand. Please cancel as early as possible so someone on the waitlist can take your spot.
              </p>
              <a href="${cancelUrl}" style="display:inline-block;padding:14px 36px;border:1px solid #8a7d74;font-size:11px;letter-spacing:0.2em;color:#5a4e45;text-decoration:none;text-transform:uppercase;font-family:Georgia,serif;">Cancel my reservation</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
            <td style="border-top:1px solid #c8bdb2;border-bottom:1px solid #c8bdb2;padding:28px 0;margin:32px 0;">
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, phone, email, timeSlot } = body

    if (!firstName || !lastName || !phone || !email || !timeSlot) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const slot = TIME_SLOTS.find(s => s.id === timeSlot)
    if (!slot) {
      return NextResponse.json({ error: 'Invalid time slot.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { count, error: countError } = await supabaseAdmin
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('time_slot', timeSlot)
      .eq('cancelled', false)

    if (countError) throw countError

    if ((count ?? 0) >= slot.capacity) {
      return NextResponse.json({ error: 'This time slot is full.' }, { status: 409 })
    }

    const { data: existing } = await supabaseAdmin
      .from('rsvps')
      .select('id')
      .eq('phone', phone)
      .eq('time_slot', timeSlot)
      .eq('cancelled', false)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'This phone number already has an RSVP for this time slot.' }, { status: 409 })
    }

    const { data, error } = await supabaseAdmin
      .from('rsvps')
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        time_slot: timeSlot,
      })
      .select()
      .single()

    if (error) throw error

    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel?token=${data.cancel_token}`

    // Email confirmation
    await sendEmail(
      email,
      `You're confirmed — ${timeSlot}, June 25th`,
      buildConfirmationEmail(firstName, timeSlot, cancelUrl),
    )

    return NextResponse.json({ success: true, rsvpId: data.id })
  } catch (err: any) {
    console.error('RSVP error:', err)
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 })
  }
}
