import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { EVENT } from '@/lib/constants'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { data: rsvp, error } = await supabaseAdmin
      .from('rsvps')
      .select('first_name, last_name, time_slot, cancelled')
      .eq('id', params.id)
      .single()

    if (error || !rsvp) {
      return new NextResponse('Not found', { status: 404 })
    }

    if (rsvp.cancelled) {
      return new NextResponse('This reservation has been cancelled', { status: 410 })
    }

    // Parse time slot
    const [time, period] = rsvp.time_slot.split(' ')
    const [hourStr, minuteStr] = time.split(':')
    let hour = parseInt(hourStr)
    const minute = parseInt(minuteStr)
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0

    const pad = (n: number) => String(n).padStart(2, '0')
    const endHour = hour + Math.floor((minute + 30) / 60)
    const endMinute = (minute + 30) % 60

    const uid = `${params.id}@catharsissoundrooms.com`

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'PRODID:-//Catharsis Soundrooms//RSVP//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART;TZID=America/Los_Angeles:20260625T${pad(hour)}${pad(minute)}00`,
      `DTEND;TZID=America/Los_Angeles:20260625T${pad(endHour)}${pad(endMinute)}00`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace('.000', '')}`,
      `SUMMARY:${EVENT.name} — ${EVENT.presenter}`,
      `DESCRIPTION:An immersive listening experience by ${EVENT.artist}. Please arrive 10 minutes early.`,
      `LOCATION:${EVENT.address}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="catharsis-soundrooms.ics"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err: any) {
    return new NextResponse('Something went wrong', { status: 500 })
  }
}
