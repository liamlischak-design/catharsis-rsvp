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

function buildWaitlistConfirmEmail(firstName: string, timeSlot: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the waitlist</title>
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
              <h1 style="margin:0 0 8px;font-size:32px;font-weight:300;font-style:italic;color:#2a2a2a;line-height:1.15;font-family:Georgia,serif;">Where They Don&rsquo;t<br/>Make Roads</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#7a6e66;font-family:Georgia,serif;">Micah Peay</p>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <p style="margin:0;font-size:11px;letter-spacing:0.15em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">You're on the waitlist, ${firstName}</p>
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
              <p style="margin:0;font-size:13px;color:#5a5048;line-height:1.9;letter-spacing:0.03em;font-family:Georgia,serif;">
                If a spot opens up, you'll receive an email with 2 hours to claim it.<br/>
                We'll notify you as soon as one becomes available.
              </p>
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
    const { firstName, lastName, email, timeSlot } = body

    if (!firstName || !lastName || !email || !timeSlot) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Check if waitlist is already full (cap: 1 per slot)
    const { count: waitlistCount } = await supabaseAdmin
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('time_slot', timeSlot)
      .eq('cancelled', false)
      .eq('claimed', false)

    if ((waitlistCount ?? 0) >= 1) {
      return NextResponse.json({ error: 'The waitlist for this session is full.' }, { status: 409 })
    }

    // Check if this email is already on the waitlist for this slot
    const { data: existing } = await supabaseAdmin
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .eq('time_slot', timeSlot)
      .eq('cancelled', false)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'This email is already on the waitlist for this session.' }, { status: 409 })
    }

    // Check if this email already has a confirmed RSVP for any slot
    const { data: existingRsvp } = await supabaseAdmin
      .from('rsvps')
      .select('id, time_slot')
      .eq('email', email)
      .eq('cancelled', false)
      .single()

    if (existingRsvp) {
      return NextResponse.json({ 
        error: `You already have a reservation for the ${existingRsvp.time_slot} session.` 
      }, { status: 409 })
    }

    const { error } = await supabaseAdmin
      .from('waitlist')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        time_slot: timeSlot,
      })

    if (error) throw error

    // Send waitlist confirmation email
    await sendEmail(
      email,
      `You're on the waitlist — ${timeSlot}, June 25th`,
      buildWaitlistConfirmEmail(firstName, timeSlot),
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Waitlist error:', err)
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 })
  }
}
