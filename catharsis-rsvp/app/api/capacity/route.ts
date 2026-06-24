import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { TIME_SLOTS } from '@/lib/constants'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Fetch confirmed bookings
    const { data, error, status, statusText } = await supabaseAdmin
      .from('rsvps')
      .select('time_slot')
      .eq('cancelled', false)

    if (error) {
      console.error('Supabase error:', JSON.stringify({ error, status, statusText }))
      throw error
    }

    // Fetch waitlist entries (unclaimed, uncancelled)
    const { data: waitlistData } = await supabaseAdmin
      .from('waitlist')
      .select('time_slot, notified_at, notified_expires_at')
      .eq('cancelled', false)
      .eq('claimed', false)

    const now = new Date()

    const counts: Record<string, number> = {}
    const waitlistCounts: Record<string, number> = {}
    const activeNotifications: Record<string, number> = {} // spots reserved for notified waitlisters

    TIME_SLOTS.forEach(slot => {
      counts[slot.id] = 0
      waitlistCounts[slot.id] = 0
      activeNotifications[slot.id] = 0
    })

    data?.forEach(row => {
      if (counts[row.time_slot] !== undefined) counts[row.time_slot]++
    })

    waitlistData?.forEach(row => {
      if (waitlistCounts[row.time_slot] !== undefined) waitlistCounts[row.time_slot]++

      // Count active notifications (notified but not yet expired)
      if (row.notified_at && row.notified_expires_at) {
        const expires = new Date(row.notified_expires_at)
        if (expires > now) {
          activeNotifications[row.time_slot] = (activeNotifications[row.time_slot] ?? 0) + 1
        }
      }
    })

    const availability = TIME_SLOTS.map(slot => {
      const booked = counts[slot.id] ?? 0
      const reserved = activeNotifications[slot.id] ?? 0 // spots held for notified waitlisters
      const effectiveAvailable = slot.capacity - booked - reserved
      const waitlistCount = waitlistCounts[slot.id] ?? 0

      return {
        id: slot.id,
        label: slot.label,
        capacity: slot.capacity,
        booked,
        available: Math.max(0, effectiveAvailable),
        waitlistFull: waitlistCount >= 2,
        // Force waitlist display if there are active notifications holding spots
        hasActiveWaitlist: reserved > 0 || (booked >= slot.capacity && waitlistCount > 0),
      }
    })

    return NextResponse.json(availability)
  } catch (err: any) {
    console.error('Capacity route error:', err?.message, err?.code, err?.details)
    return NextResponse.json({ error: err.message, code: err.code, details: err.details }, { status: 500 })
  }
}
