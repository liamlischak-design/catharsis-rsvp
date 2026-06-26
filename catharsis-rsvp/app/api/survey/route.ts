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
      from: 'Catharsis Soundrooms <hello@catharsissoundrooms.com>',
      to,
      subject,
      html,
    }),
  })
  return res.ok
}

const SURVEY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScZJaX2yvXNO3akwFTPN4aCaQPE7rJbbwJ31wWytSLsG36jrg/viewform?usp=header'

function buildSurveyEmail(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A quick favor</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#f5f0eb;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <img
                src="https://catharsissoundrooms.com/catharsis-lockup.svg"
                alt="Catharsis Soundrooms"
                width="200"
                style="display:block;"
              />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 24px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#2a2a2a;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#2a2a2a;">
                We created something new last night and you were one of the first people to experience it. We'd love to know what you actually thought — what resonated, what didn't, what surprised you, and what you'd want to see done differently for the next one.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.8;color:#2a2a2a;">
                Honest answers only. Takes 5 minutes.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 36px;">
                <tr>
                  <td align="center" style="background-color:#2a2a2a;padding:14px 32px;">
                    <a
                      href="${SURVEY_URL}"
                      style="color:#f5f0eb;font-family:Georgia,serif;font-size:13px;letter-spacing:0.12em;text-decoration:none;text-transform:uppercase;"
                    >
                      Take the survey →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:15px;line-height:1.8;color:#2a2a2a;">
                With gratitude,
              </p>
              <p style="margin:0 0 36px;font-size:15px;line-height:1.8;color:#2a2a2a;">
                Liam @ Catharsis Soundrooms
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 24px;">
              <hr style="border:none;border-top:1px solid #c8bdb2;margin:0 0 24px;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 24px 40px;">
              <p style="margin:0;font-size:11px;line-height:1.8;color:#8a7d74;letter-spacing:0.04em;">
                You attended the June 25th Catharsis Soundrooms experience at Satellite One, Venice.
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
      'A quick favor',
      buildSurveyEmail(rsvp.first_name),
    )
    if (ok) results.sent++
    else results.failed++

    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return NextResponse.json({ success: true, ...results })
}
