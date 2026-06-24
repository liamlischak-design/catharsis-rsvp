import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
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
  return res.ok
}

function buildSurveyEmail(firstName: string) {
  const surveyUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScZJaX2yvXNO3akwFTPN4aCaQPE7rJbbwJ31wWytSLsG36jrg/viewform'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your honest take matters</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:40px;text-align:center;border-bottom:1px solid #c8bdb2;">
              <p style="margin:0 0 4px;font-size:15px;letter-spacing:0.25em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">Catharsis Soundrooms</p>
              <p style="margin:0;font-size:15px;letter-spacing:0.15em;color:#8a7d74;text-transform:uppercase;font-family:Georgia,serif;">@ Satellite One</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:40px 0 32px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:300;font-style:italic;color:#2a2a2a;line-height:1.15;font-family:Georgia,serif;">Where They Don&rsquo;t Make Roads</h1>
              <p style="margin:0;font-size:13px;font-weight:300;color:#9a8d84;letter-spacing:0.08em;font-family:Georgia,serif;text-transform:uppercase;">A New Album by Micah Peay</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 20px;font-size:15px;color:#2a2a2a;line-height:1.9;font-family:Georgia,serif;">
                ${firstName},
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#2a2a2a;line-height:1.9;font-family:Georgia,serif;">
                You were in the room.
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#5a5048;line-height:1.9;font-family:Georgia,serif;">
                That means something. Not just to us — but to what comes next.
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#5a5048;line-height:1.9;font-family:Georgia,serif;">
                What you experienced at Satellite One was the first of its kind. A new format for how recorded music can be heard, felt, and shared. And you were part of the proof of concept.
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#5a5048;line-height:1.9;font-family:Georgia,serif;">
                We're building something we believe in deeply, and your voice right now — honest, unfiltered, from someone who was actually there — is the most valuable thing we have as we take the next step.
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#5a5048;line-height:1.9;font-family:Georgia,serif;">
                This survey takes 3 minutes. Your answers will directly shape how Catharsis Soundrooms grows, who we bring in next, and what the experience looks and feels like for thousands of people down the road.
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#5a5048;line-height:1.9;font-family:Georgia,serif;">
                Please don't hold back. The good, the bad, the &ldquo;I wish you had done this differently&rdquo; — we want all of it.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-bottom:40px;text-align:center;">
              <a href="${surveyUrl}" style="display:inline-block;padding:18px 48px;background:#2a2a2a;color:#f5f0eb;font-size:12px;letter-spacing:0.2em;text-decoration:none;text-transform:uppercase;font-family:Georgia,serif;">Take the Survey →</a>
            </td>
          </tr>

          <!-- Sign off -->
          <tr>
            <td style="border-top:1px solid #c8bdb2;padding-top:32px;">
              <p style="margin:0 0 8px;font-size:14px;color:#5a5048;line-height:1.9;font-family:Georgia,serif;">
                With gratitude,<br/>
                Liam &amp; the Catharsis Soundrooms team
              </p>
              <p style="margin:16px 0 0;font-size:11px;color:#9a8d84;line-height:1.8;font-family:Georgia,serif;">
                You attended the June 25th album experience at Satellite One, Venice. This survey is for research purposes only and your responses will remain confidential.
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

export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET via header or query param
  const authHeader = req.headers.get('authorization')
  const { searchParams } = new URL(req.url)
  const querySecret = searchParams.get('secret')
  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === process.env.CRON_SECRET
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: rsvps, error } = await supabaseAdmin
    .from('rsvps')
    .select('first_name, email')
    .eq('cancelled', false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = { sent: 0, failed: 0 }

  for (const rsvp of rsvps ?? []) {
    const ok = await sendEmail(
      rsvp.email,
      'Your honest take matters more than you know',
      buildSurveyEmail(rsvp.first_name),
    )
    if (ok) results.sent++
    else results.failed++

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return NextResponse.json({ success: true, ...results })
}
