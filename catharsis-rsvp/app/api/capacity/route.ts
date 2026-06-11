import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { TIME_SLOTS } from '@/lib/constants'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('rsvps')
      .select('time_slot')
      .eq('cancelled', false)

    if (error) throw error

    const counts: Record<string, number> = {}
    TIME_SLOTS.forEach(slot => { counts[slot.id] = 0 })
    data?.forEach(row => {
      if (counts[row.time_slot] !== undefined) {
        counts[row.time_slot]++
      }
    })

    const availability = TIME_SLOTS.map(slot => ({
      id: slot.id,
      label: slot.label,
      capacity: slot.capacity,
      booked: counts[slot.id] ?? 0,
      available: slot.capacity - (counts[slot.id] ?? 0),
    }))

    return NextResponse.json(availability)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
