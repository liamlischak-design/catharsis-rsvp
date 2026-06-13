import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { TIME_SLOTS } from '@/lib/constants'

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

function buildClaimConfirmEmail(firstName: string, timeSlot: string, cancelUrl: string) {
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
              <p style="margin:0;font-size:11px;letter-spacing:0.15em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">You are confirmed, ${firstName}</p>
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
                  <td style="padding-bottom:14px;">
                    <span style="font-size:10px;letter-spacing:0.12em;color:#7a6e66;text-transform:uppercase;font-family:Georgia,serif;">Location</span>
                    <span style="float:right;font-size:14px;color:#2a2a2a;font-family:Georgia,serif;">2100 Zeno Pl<br/>Venice, CA 90291</span>
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

          <tr>
            <td style="padding:32px 0;text-align:center;">
              <p style="margin:0;font-size:13px;color:#5a5048;line-height:1.9;font-family:Georgia,serif;">
                Please arrive 10 minutes before your session.<br/>
                Once started, the experience cannot be interrupted.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:32px;border-top:1px solid #c8bdb2;text-align:center;">
              <p style="margin:0 0 12px;font-size:12px;color:#8a7d74;line-height:1.8;font-family:Georgia,serif;">
                Need to cancel? Use the link below.<br/>
                We ask that you do so as early as possible so others may attend.
              </p>
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
  try {
    const { searchParams } = new URL(req.url)
    const waitlistId = searchParams.get('waitlist_id')
    if (!waitlistId) return NextResponse.json({ error: 'Invalid link.' }, { status: 400 })

    const supabaseAdmin = getSupabaseAdmin()

    const { data: entry, error } = await supabaseAdmin
      .from('waitlist')
      .select('*')
      .eq('id', waitlistId)
      .single()

    if (error || !entry) return NextResponse.json({ error: 'Waitlist entry not found.' }, { status: 404 })
    if (entry.claimed) return NextResponse.json({ error: 'This spot has already been claimed.' }, { status: 409 })
    if (entry.cancelled) return NextResponse.json({ error: 'This waitlist entry has been cancelled.' }, { status: 409 })
    if (!entry.notified_at) return NextResponse.json({ error: 'No spot is currently available.' }, { status: 409 })

    // Check if 2-hour window has expired
    const now = new Date()
    const expires = new Date(entry.notified_expires_at)
    if (now > expires) {
      return NextResponse.json({ error: 'Your claim window has expired. The spot was offered to the next person.' }, { status: 410 })
    }

    // Check the slot still has capacity
    const slot = TIME_SLOTS.find(s => s.id === entry.time_slot)
    if (!slot) return NextResponse.json({ error: 'Invalid time slot.' }, { status: 400 })

    const { count } = await supabaseAdmin
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('time_slot', entry.time_slot)
      .eq('cancelled', false)

    if ((count ?? 0) >= slot.capacity) {
      return NextResponse.json({ error: 'Sorry, this slot has filled up again.' }, { status: 409 })
    }

    // Check they don't already have an RSVP
    const { data: existingRsvp } = await supabaseAdmin
      .from('rsvps')
      .select('id, time_slot')
      .eq('email', entry.email)
      .eq('cancelled', false)
      .single()

    if (existingRsvp) {
      return NextResponse.json({ error: `You already have a reservation for the ${existingRsvp.time_slot} session.` }, { status: 409 })
    }

    // Create the RSVP
    const { data: rsvp, error: rsvpError } = await supabaseAdmin
      .from('rsvps')
      .insert({
        first_name: entry.first_name,
        last_name: entry.last_name,
        phone: '',
        email: entry.email,
        time_slot: entry.time_slot,
      })
      .select()
      .single()

    if (rsvpError) throw rsvpError

    // Mark waitlist entry as claimed
    await supabaseAdmin
      .from('waitlist')
      .update({ claimed: true })
      .eq('id', waitlistId)

    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel?token=${rsvp.cancel_token}`

    // Send confirmation email
    await sendEmail(
      entry.email,
      `You're confirmed — ${entry.time_slot}, June 25th`,
      buildClaimConfirmEmail(entry.first_name, entry.time_slot, cancelUrl),
    )

    return NextResponse.json({ success: true, timeSlot: entry.time_slot, firstName: entry.first_name })
  } catch (err: any) {
    console.error('Claim error:', err)
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 })
  }
}
