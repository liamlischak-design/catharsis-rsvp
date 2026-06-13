import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

async function sendEmail(to: string, subject: string, html: string) {
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
    }),
  })
}

function buildSpotOpenEmail(firstName: string, timeSlot: string, claimUrl: string) {
  const expiresText = 'You have 2 hours to claim your spot.'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A spot opened up</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <tr>
            <td style="padding-bottom:40px;text-align:center;border-bottom:1px solid #c8bdb2;">
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.25em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">Catharsis Soundrooms</p>
              <p style="margin:0;font-size:10px;letter-spacing:0.15em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">Presents</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 0 32px;text-align:center;">
              <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.15em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">A spot opened up, ${firstName}</p>
              <h1 style="margin:0 0 8px;font-size:32px;font-weight:300;font-style:italic;color:#2a2a2a;line-height:1.15;font-family:Georgia,serif;">Where They Don&rsquo;t<br/>Make Roads</h1>
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
              <p style="margin:0 0 24px;font-size:13px;color:#5a5048;line-height:1.9;font-family:Georgia,serif;">
                ${expiresText}<br/>
                After that, the spot will be offered to the next person.
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

async function notifyNextOnWaitlist(timeSlot: string, supabaseAdmin: any) {
  // Get the next unclaimed, unnotified person on the waitlist for this slot
  const { data: next } = await supabaseAdmin
    .from('waitlist')
    .select('*')
    .eq('time_slot', timeSlot)
    .eq('claimed', false)
    .eq('cancelled', false)
    .is('notified_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!next) return // No one on the waitlist

  // Check they don't already have an RSVP for another slot
  const { data: existingRsvp } = await supabaseAdmin
    .from('rsvps')
    .select('id')
    .eq('email', next.email)
    .eq('cancelled', false)
    .single()

  if (existingRsvp) {
    // They already booked another slot — mark as cancelled and try the next person
    await supabaseAdmin
      .from('waitlist')
      .update({ cancelled: true })
      .eq('id', next.id)
    await notifyNextOnWaitlist(timeSlot, supabaseAdmin)
    return
  }

  // Set 2-hour claim window
  const now = new Date()
  const expires = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  await supabaseAdmin
    .from('waitlist')
    .update({
      notified_at: now.toISOString(),
      notified_expires_at: expires.toISOString(),
    })
    .eq('id', next.id)

  const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/claim?waitlist_id=${next.id}`

  await sendEmail(
    next.email,
    `A spot opened up — ${timeSlot}, June 25th`,
    buildSpotOpenEmail(next.first_name, timeSlot, claimUrl),
  )
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Invalid cancel token.' }, { status: 400 })

    const supabaseAdmin = getSupabaseAdmin()

    const { data: rsvp, error: findError } = await supabaseAdmin
      .from('rsvps')
      .select('*')
      .eq('cancel_token', token)
      .single()

    if (findError || !rsvp) return NextResponse.json({ error: 'RSVP not found.' }, { status: 404 })
    if (rsvp.cancelled) return NextResponse.json({ error: 'This RSVP has already been cancelled.' }, { status: 409 })

    const { error: updateError } = await supabaseAdmin
      .from('rsvps')
      .update({ cancelled: true })
      .eq('cancel_token', token)

    if (updateError) throw updateError

    // Notify next person on waitlist for this slot
    await notifyNextOnWaitlist(rsvp.time_slot, supabaseAdmin)

    return NextResponse.json({ success: true, timeSlot: rsvp.time_slot, firstName: rsvp.first_name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Invalid cancel token.' }, { status: 400 })

    const supabaseAdmin = getSupabaseAdmin()

    const { data: rsvp, error } = await supabaseAdmin
      .from('rsvps')
      .select('first_name, last_name, time_slot, cancelled')
      .eq('cancel_token', token)
      .single()

    if (error || !rsvp) return NextResponse.json({ error: 'RSVP not found.' }, { status: 404 })

    return NextResponse.json(rsvp)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
