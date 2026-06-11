import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { TIME_SLOTS } from '@/lib/constants'
import twilio from 'twilio'

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

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel?token=${data.cancel_token}`
    const smsBody = `Catharsis Soundrooms invites you to Where They Don't Make Roads by Micah Peay — June 25th at ${timeSlot}. 2100 Zeno Pl, Venice. Arrive 10 min early 🖤\n\nTo cancel: ${cancelUrl}\n\nFor help, reply HELP. To opt-out, reply STOP. Msg & data rates may apply.`

    await twilioClient.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`,
    })

    return NextResponse.json({ success: true, rsvpId: data.id })
  } catch (err: any) {
    console.error('RSVP error:', err)
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 })
  }
}
