import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { TIME_SLOTS } from '@/lib/constants'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error, status, statusText } = await supabaseAdmin
      .from('rsvps')
      .select('time_slot')
      .eq('cancelled', false)

    if (error) {
      console.error('Supabase error:', JSON.stringify({ error, status, statusText }))
      throw error
    }

    // Also fetch waitlist counts per slot
    const { data: waitlistData } = await supabaseAdmin
      .from('waitlist')
      .select('time_slot')
      .eq('cancelled', false)
      .eq('claimed', false)

    const counts: Record<string, number> = {}
    const waitlistCounts: Record<string, number> = {}
    TIME_SLOTS.forEach(slot => { counts[slot.id] = 0; waitlistCounts[slot.id] = 0 })
    data?.forEach(row => {
      if (counts[row.time_slot] !== undefined) counts[row.time_slot]++
    })
    waitlistData?.forEach(row => {
      if (waitlistCounts[row.time_slot] !== undefined) waitlistCounts[row.time_slot]++
    })

    const availability = TIME_SLOTS.map(slot => ({
      id: slot.id,
      label: slot.label,
      capacity: slot.capacity,
      booked: counts[slot.id] ?? 0,
      available: slot.capacity - (counts[slot.id] ?? 0),
      waitlistFull: (waitlistCounts[slot.id] ?? 0) >= 2,
    }))

    return NextResponse.json(availability)
  } catch (err: any) {
    console.error('Capacity route error:', err?.message, err?.code, err?.details)
    return NextResponse.json({ error: err.message, code: err.code, details: err.details }, { status: 500 })
  }
}
