# Catharsis Soundrooms — RSVP App

Event RSVP booking page for *Where They Don't Make Roads* by Micah Peay, June 25th, 2026.

---

## Step 1: Run the Supabase schema

1. Go to your Supabase project → SQL Editor
2. Paste the contents of `supabase-schema.sql` and click Run

---

## Step 2: Set environment variables

Edit `.env.local`:

- TWILIO_PHONE_NUMBER — add your purchased Twilio number (format: +13105551234)
- ADMIN_PASSWORD — choose any password for the /admin page
- All other values are already pre-filled

---

## Step 3: Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import the repo
3. Add all env vars from .env.local in Vercel dashboard
4. Deploy
5. After deploy, update NEXT_PUBLIC_APP_URL to your actual Vercel URL

---

## Pages

- / — RSVP booking page
- /cancel?token=XXX — cancellation page (linked from confirmation SMS)
- /admin — password-protected attendee list
- /privacy — privacy policy
- /terms — terms & conditions

---

## Sending Reminders

Confirmation SMS sends automatically on RSVP.

For day-before and day-of reminders, visit /admin, export the list, and send manually from your Twilio console — or ask Claude to build a reminder script.

