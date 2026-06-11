import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

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
