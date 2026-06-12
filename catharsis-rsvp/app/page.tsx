'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface SlotAvailability {
  id: string
  label: string
  capacity: number
  booked: number
  available: number
}

interface FormData {
  firstName: string
  lastName: string
  phone: string
  email: string
}

const CORRECT_PASSWORD = 'v1'

function LogoLockup({ width = 480 }: { width?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: width, margin: '0 auto' }}>
      <Image
        src="/catharsis-logo.png"
        alt="Catharsis"
        width={960}
        height={540}
        style={{ width: '100%', height: 'auto', display: 'block', mixBlendMode: 'screen' as const }}
        priority
      />
      <div style={{
        position: 'absolute',
        bottom: '4%',
        right: '6%',
        width: '26%',
      }}>
        <Image
          src="/soundrooms.png"
          alt="Soundrooms"
          width={400}
          height={100}
          style={{ width: '100%', height: 'auto', display: 'block', mixBlendMode: 'screen' as const }}
        />
      </div>
    </div>
  )
}

export default function Home() {
  const [unlocked, setUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [slots, setSlots] = useState<SlotAvailability[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({ firstName: '', lastName: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [slotsLoading, setSlotsLoading] = useState(true)

  useEffect(() => {
    if (unlocked) fetchCapacity()
  }, [unlocked])

  async function fetchCapacity() {
    setSlotsLoading(true)
    try {
      const res = await fetch('/api/capacity')
      const data = await res.json()
      setSlots(data)
    } catch (e) {
      console.error(e)
    } finally {
      setSlotsLoading(false)
    }
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (passwordInput === CORRECT_PASSWORD) {
      setUnlocked(true)
      setPasswordError(false)
    } else {
      setPasswordError(true)
      setPasswordInput('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) { setError('Please select a time slot.'); return }
    if (!form.firstName || !form.lastName || !form.phone || !form.email) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, timeSlot: selectedSlot }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        setSubmitted(true)
      }
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!unlocked) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#000' }}>
        <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
          <LogoLockup width={520} />
          <form onSubmit={handlePasswordSubmit} style={{ marginTop: '48px' }}>
            <input
              type="password"
              placeholder="enter password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(false) }}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${passwordError ? '#cc4444' : '#333'}`,
                color: '#fff',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '18px',
                fontWeight: 300,
                letterSpacing: '0.2em',
                outline: 'none',
                padding: '12px 0',
                textAlign: 'center',
                width: '100%',
                marginBottom: '8px',
              }}
            />
            {passwordError && (
              <p style={{ fontSize: '11px', color: '#cc4444', letterSpacing: '0.1em', marginBottom: '8px' }}>incorrect</p>
            )}
            <button
              type="submit"
              style={{
                background: 'transparent',
                border: '1px solid #555',
                color: '#aaa',
                cursor: 'pointer',
                fontSize: '13px',
                letterSpacing: '0.25em',
                marginTop: '28px',
                padding: '14px 48px',
                textTransform: 'uppercase',
              }}
            >
              enter
            </button>
          </form>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#000' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: '32px' }}>
            <LogoLockup width={320} />
          </div>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#555', marginBottom: '8px', textTransform: 'uppercase' }}>
            You are confirmed
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '38px', lineHeight: 1.1, marginBottom: '8px', color: '#fff' }}>
            Where They Don&apos;t<br />Make Roads
          </h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '18px', color: '#555', marginBottom: '32px' }}>Micah Peay</p>
          <div style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '24px 0', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Session</span>
              <span style={{ fontSize: '14px', color: '#fff' }}>{selectedSlot}, June 25th</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Location</span>
              <span style={{ fontSize: '14px', color: '#fff', textAlign: 'right' }}>2100 Zeno Pl<br />Venice, CA 90291</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Name</span>
              <span style={{ fontSize: '14px', color: '#fff' }}>{form.firstName} {form.lastName}</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#555', lineHeight: 1.9, letterSpacing: '0.04em' }}>
            A confirmation has been sent to your phone.<br />
            Please arrive 10 minutes before your session.<br />
            To cancel, use the link in your confirmation text.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', padding: '60px 24px 80px', background: '#000' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <LogoLockup width={560} />
        </div>

        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.25em', color: '#444', marginBottom: '16px', textTransform: 'uppercase', textAlign: 'center' }}>
            Presents
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(32px, 7vw, 50px)', lineHeight: 1.05, marginBottom: '10px', color: '#fff', textAlign: 'center' }}>
            Where They Don&apos;t<br />Make Roads
          </h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '18px', color: '#555', marginBottom: '20px', textAlign: 'center' }}>
            Micah Peay
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '12px', color: '#444', letterSpacing: '0.08em' }}>June 25th, 2026</span>
            <span style={{ color: '#333' }}>—</span>
            <span style={{ fontSize: '12px', color: '#444', letterSpacing: '0.08em' }}>2100 Zeno Pl, Venice</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '32px', marginBottom: '40px' }}>
          <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.9, letterSpacing: '0.02em' }}>
            Come experience a new visual format for listening to recorded albums. Please arrive 10 minutes early before your scheduled session to ensure you don&apos;t miss a minute.
          </p>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#444', marginBottom: '16px', textTransform: 'uppercase' }}>
            Select a session
          </p>
          {slotsLoading ? (
            <p style={{ fontSize: '13px', color: '#444' }}>Loading availability...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {slots.map(slot => {
                const isFull = slot.available === 0
                const isAlmostFull = slot.available <= 2 && slot.available > 0
                const isSelected = selectedSlot === slot.id
                return (
                  <button
                    key={slot.id}
                    onClick={() => !isFull && setSelectedSlot(slot.id)}
                    disabled={isFull}
                    style={{
                      background: isSelected ? '#fff' : 'transparent',
                      border: `1px solid ${isSelected ? '#fff' : isFull ? '#1a1a1a' : '#222'}`,
                      color: isSelected ? '#000' : isFull ? '#2a2a2a' : '#fff',
                      padding: '16px 8px',
                      textAlign: 'center',
                      cursor: isFull ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 400, marginBottom: '4px', letterSpacing: '0.05em' }}>
                      {slot.label}
                    </div>
                    <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: isSelected ? '#555' : isFull ? '#2a2a2a' : isAlmostFull ? '#666' : '#444', textTransform: 'uppercase' }}>
                      {isFull ? 'Full' : isAlmostFull ? `${slot.available} left` : 'Available'}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#444', marginBottom: '16px', textTransform: 'uppercase' }}>
            Your information
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <input type="text" placeholder="First name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
            <input type="text" placeholder="Last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <input type="tel" placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: '#cc4444', marginBottom: '16px', letterSpacing: '0.05em' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !selectedSlot}
            style={{
              background: selectedSlot && !loading ? '#fff' : '#0a0a0a',
              border: `1px solid ${selectedSlot && !loading ? '#fff' : '#1a1a1a'}`,
              color: selectedSlot && !loading ? '#000' : '#333',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              padding: '18px 32px',
              textTransform: 'uppercase',
              width: '100%',
              cursor: selectedSlot && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Reserving...' : 'Reserve My Spot'}
          </button>

          <p style={{ fontSize: '11px', color: '#333', marginTop: '16px', lineHeight: 1.8, letterSpacing: '0.03em' }}>
            By reserving, you consent to receive SMS confirmation and reminders for this event.
            Msg &amp; data rates may apply. Reply STOP to opt out.
          </p>
        </form>

        <div style={{ borderTop: '1px solid #111', marginTop: '60px', paddingTop: '24px', display: 'flex', gap: '24px' }}>
          <a href="/privacy" style={{ fontSize: '10px', color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: '10px', color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Terms</a>
        </div>
      </div>
    </main>
  )
}
