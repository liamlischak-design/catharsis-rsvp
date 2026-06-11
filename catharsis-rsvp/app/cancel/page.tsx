'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function CancelContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'confirm' | 'cancelled' | 'error' | 'already'>('loading')
  const [rsvp, setRsvp] = useState<{ first_name: string; time_slot: string; cancelled: boolean } | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    fetch(`/api/cancel?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus('error'); return }
        setRsvp(data)
        setStatus(data.cancelled ? 'already' : 'confirm')
      })
      .catch(() => setStatus('error'))
  }, [token])

  async function handleCancel() {
    setCancelling(true)
    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('cancelled')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setCancelling(false)
    }
  }

  const containerStyle = {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '40px 24px',
  }
  const innerStyle = { maxWidth: '420px', width: '100%', textAlign: 'center' as const }
  const labelStyle = { fontSize: '10px', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase' as const, marginBottom: '20px' }
  const titleStyle = { fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '36px', lineHeight: 1.1, marginBottom: '8px' }
  const artistStyle = { fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '16px', color: '#888', marginBottom: '32px' }

  if (status === 'loading') return (
    <main style={containerStyle}>
      <div style={innerStyle}>
        <p style={{ fontSize: '13px', color: '#666' }}>Loading...</p>
      </div>
    </main>
  )

  if (status === 'error') return (
    <main style={containerStyle}>
      <div style={innerStyle}>
        <p style={labelStyle}>Catharsis Soundrooms</p>
        <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.8 }}>This cancellation link is invalid or has expired.</p>
        <a href="/" style={{ display: 'block', marginTop: '24px', fontSize: '11px', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Back to RSVP
        </a>
      </div>
    </main>
  )

  if (status === 'already') return (
    <main style={containerStyle}>
      <div style={innerStyle}>
        <p style={labelStyle}>Catharsis Soundrooms</p>
        <h1 style={titleStyle}>Where They Don&apos;t<br />Make Roads</h1>
        <p style={artistStyle}>Micah Peay</p>
        <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.8 }}>
          This RSVP has already been cancelled.
        </p>
        <a href="/" style={{ display: 'block', marginTop: '24px', fontSize: '11px', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Reserve a new spot
        </a>
      </div>
    </main>
  )

  if (status === 'cancelled') return (
    <main style={containerStyle}>
      <div style={innerStyle}>
        <p style={labelStyle}>Catharsis Soundrooms</p>
        <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#888', marginBottom: '12px', textTransform: 'uppercase' }}>
          Reservation cancelled
        </p>
        <h1 style={titleStyle}>Where They Don&apos;t<br />Make Roads</h1>
        <p style={artistStyle}>Micah Peay</p>
        <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.8, marginBottom: '28px' }}>
          Your {rsvp?.time_slot} session has been cancelled.<br />We hope to see you next time.
        </p>
        <a href="/" style={{ fontSize: '11px', color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Reserve a different session
        </a>
      </div>
    </main>
  )

  return (
    <main style={containerStyle}>
      <div style={innerStyle}>
        <p style={labelStyle}>Catharsis Soundrooms</p>
        <h1 style={titleStyle}>Where They Don&apos;t<br />Make Roads</h1>
        <p style={artistStyle}>Micah Peay</p>

        <div style={{ borderTop: '1px solid #222', borderBottom: '1px solid #222', padding: '20px 0', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Name</span>
            <span style={{ fontSize: '13px' }}>{rsvp?.first_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Session</span>
            <span style={{ fontSize: '13px' }}>{rsvp?.time_slot}, June 25th</span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.8, marginBottom: '28px' }}>
          Are you sure you want to cancel this reservation?
        </p>

        <button
          onClick={handleCancel}
          disabled={cancelling}
          style={{
            background: 'transparent',
            border: '1px solid #444',
            color: '#888',
            fontSize: '11px',
            letterSpacing: '0.12em',
            padding: '14px 28px',
            textTransform: 'uppercase',
            width: '100%',
            marginBottom: '12px',
            cursor: cancelling ? 'not-allowed' : 'pointer',
          }}
        >
          {cancelling ? 'Cancelling...' : 'Yes, cancel my reservation'}
        </button>

        <a href="/" style={{ fontSize: '11px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Keep my reservation
        </a>
      </div>
    </main>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#666', fontSize: '13px' }}>Loading...</p></main>}>
      <CancelContent />
    </Suspense>
  )
}
