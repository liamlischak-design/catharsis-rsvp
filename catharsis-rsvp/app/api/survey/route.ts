import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Liam <liam@catharsissoundrooms.com>',
      reply_to: 'liamlischak@gmail.com',
      to,
      subject,
      html,
    }),
  })
  return res.ok
}

const SURVEY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScZJaX2yvXNO3akwFTPN4aCaQPE7rJbbwJ31wWytSLsG36jrg/viewform'

function buildSurveyEmail(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>One week ago...</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#f5f0eb;">
          <tr>
            <td style="padding:0 32px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#2a2a2a;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#2a2a2a;">
                Thanks again for coming out last week! It meant a lot having you there for v1.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#2a2a2a;">
                If you haven't yet, I'd really appreciate your honest take on it. Just a few quick questions, takes about five minutes:
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#2a2a2a;">
                <a href="${SURVEY_URL}" style="color:#2a2a2a;text-decoration:underline;">Take the survey</a>
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#2a2a2a;">
                And if you've already filled it out... thank you, truly.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#2a2a2a;">
                If the link gives you any trouble, please let me know!
              </p>
              <p style="margin:0;font-size:15px;line-height:1.8;color:#2a2a2a;">
                Happy Fourth,<br />Liam
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
  const secretParam = req.nextUrl.searchParams.get('secret')
  const authHeader = req.headers.get('authorization')

  const isAuthorized =
    secretParam === process.env.CRON_SECRET ||
    authHeader === `Bearer ${process.env.CRON_SECRET}`

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
      'One week ago...',
      buildSurveyEmail(rsvp.first_name),
    )
    if (ok) results.sent++
    else results.failed++

    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return NextResponse.json({ success: true, ...results })
}
