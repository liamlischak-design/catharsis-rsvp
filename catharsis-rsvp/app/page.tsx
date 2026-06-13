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
    <div style={{ width: '100%', maxWidth: width, margin: '0 auto' }}>
      <img
        src="/catharsis-lockup.svg"
        alt="Catharsis Soundrooms"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
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
      <main style={{ height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: 'radial-gradient(ellipse at center, #f5f0eb 0%, #e8dfd6 35%, #d9cfc6 70%, #c8bdb2 100%)' }}>
        <div style={{ maxWidth: '680px', width: '100%', textAlign: 'center' }}>
          <LogoLockup width={680} />
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
                borderBottom: `1px solid ${passwordError ? '#cc4444' : '#8a7d74'}`,
                color: '#2a2a2a',
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
                border: '1px solid #8a7d74',
                color: '#5a4e45',
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
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'radial-gradient(ellipse at center, #f5f0eb 0%, #e8dfd6 35%, #d9cfc6 70%, #c8bdb2 100%)' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: '32px' }}>
            <LogoLockup width={320} />
          </div>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#7a6e66', marginBottom: '8px', textTransform: 'uppercase' }}>
            You are confirmed
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '38px', lineHeight: 1.1, marginBottom: '8px', color: '#fff' }}>
            Where They Don&apos;t<br />Make Roads
          </h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '18px', color: '#7a6e66', marginBottom: '32px' }}>Micah Peay</p>
          <div style={{ borderTop: '1px solid #c8bdb2', borderBottom: '1px solid #c8bdb2', padding: '24px 0', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#7a6e66', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Session</span>
              <span style={{ fontSize: '14px', color: '#2a2a2a' }}>{selectedSlot}, June 25th</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#7a6e66', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Location</span>
              <span style={{ fontSize: '14px', color: '#2a2a2a', textAlign: 'right' }}>2100 Zeno Pl<br />Venice, CA 90291</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#7a6e66', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Name</span>
              <span style={{ fontSize: '14px', color: '#2a2a2a' }}>{form.firstName} {form.lastName}</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#7a6e66', lineHeight: 1.9, letterSpacing: '0.04em' }}>
            A confirmation has been sent to your phone.<br />
            Please arrive 10 minutes before your session.<br />
            To cancel, use the link in your confirmation text.
          </p>
        </div>
      </main>
    )
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .booking-layout {
            flex-direction: column !important;
            background-image: none !important;
            background-color: #dfd6cd !important;
          }
          .mobile-hero {
            display: block !important;
          }
          .booking-right {
            width: 100% !important;
            min-height: unset !important;
            padding: 36px 24px 60px !important;
            background: transparent !important;
          }
          .desktop-only {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-hero { display: none !important; }
          .desktop-only { display: flex !important; }
        }
      `}</style>
      <main className="booking-layout" style={{
        minHeight: '100vh',
        backgroundImage: 'url(/micah-peay-v5.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'left top',
        backgroundColor: '#dfd6cd',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
      }}>
        {/* Mobile hero image with logo above */}
        <div className="mobile-hero" style={{ display: 'none', width: '100%' }}>
          <div style={{ padding: '36px 24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <LogoLockup width={280} />
            <p style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#8a7d74', textTransform: 'uppercase' }}>Presents</p>
          </div>
          <img
            src="/micah-peay-mobile.png"
            alt="Where They Don't Make Roads — Micah Peay"
            style={{ width: '100%', display: 'block' }}
          />
        </div>
        <div className="booking-right" style={{
          width: '42%',
          minHeight: '100vh',
          padding: '40px 32px 60px',
          overflowY: 'auto',
          background: 'transparent',
        }}>
          <div className="desktop-only" style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <LogoLockup width={360} />
          </div>

          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#8a7d74', letterSpacing: '0.08em', marginBottom: '4px' }}>June 25th, 2026 @ Satellite</p>
            <p style={{ fontSize: '14px', color: '#8a7d74', letterSpacing: '0.08em' }}>2100 Zeno Pl, Venice</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: '#5a5048', lineHeight: 1.8, letterSpacing: '0.02em' }}>
              Step inside the album and experience music like never before. Please arrive 10 minutes before your scheduled session time to ensure entry. Once started, the album experience cannot be interrupted. Each album listening session runs approximately 25 minutes.
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#8a7d74', marginBottom: '12px', textTransform: 'uppercase' }}>
              Select a session
            </p>
            {slotsLoading ? (
              <p style={{ fontSize: '13px', color: '#8a7d74' }}>Loading availability...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
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
                        background: isSelected ? '#2a2a2a' : 'transparent',
                        border: `1px solid ${isSelected ? '#2a2a2a' : isFull ? '#d8d0c8' : '#8a7d74'}`,
                        color: isSelected ? '#f5f0eb' : isFull ? '#c8bdb2' : '#2a2a2a',
                        padding: '12px 6px',
                        textAlign: 'center',
                        cursor: isFull ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 400, marginBottom: '3px', letterSpacing: '0.05em' }}>
                        {slot.label}
                      </div>
                      <div style={{ fontSize: '9px', letterSpacing: '0.1em', color: isSelected ? '#c8bdb2' : isFull ? '#d8d0c8' : isAlmostFull ? '#8a7d74' : '#9a8d84', textTransform: 'uppercase' }}>
                        {isFull ? 'Full' : isAlmostFull ? `${slot.available} left` : 'Available'}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#8a7d74', marginBottom: '12px', textTransform: 'uppercase' }}>
              Your information
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
              <input type="text" placeholder="First name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
              <input type="text" placeholder="Last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <input type="tel" placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            {error && (
              <p style={{ fontSize: '12px', color: '#cc4444', marginBottom: '16px', letterSpacing: '0.05em' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !selectedSlot}
              style={{
                background: selectedSlot && !loading ? '#2a2a2a' : 'transparent',
                border: `1px solid ${selectedSlot && !loading ? '#2a2a2a' : '#c8bdb2'}`,
                color: selectedSlot && !loading ? '#f5f0eb' : '#b0a49c',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                padding: '16px 32px',
                textTransform: 'uppercase',
                width: '100%',
                cursor: selectedSlot && !loading ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Reserving...' : 'Reserve My Spot'}
            </button>

            <p style={{ fontSize: '11px', color: '#9a8d84', marginTop: '14px', lineHeight: 1.8, letterSpacing: '0.03em' }}>
              By reserving, you consent to receive SMS confirmation and reminders for this event.
              Msg &amp; data rates may apply. Reply STOP to opt out.
            </p>
          </form>

          <div style={{ borderTop: '1px solid #c8bdb2', marginTop: '40px', paddingTop: '20px', display: 'flex', gap: '24px' }}>
            <a href="/privacy" style={{ fontSize: '10px', color: '#9a8d84', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Privacy Policy</a>
            <a href="/terms" style={{ fontSize: '10px', color: '#9a8d84', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Terms</a>
          </div>
        </div>
      </main>
    </>
  )
}
