'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function LogoLockup({ width = 320 }: { width?: number }) {
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

type ClaimState = 'loading' | 'success' | 'error' | 'expired' | 'already_claimed'

const bgStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 24px',
  background: 'radial-gradient(ellipse at center, #f5f0eb 0%, #e8dfd6 35%, #dfd6cd 70%, #d0c8be 100%)',
}

function ClaimPageInner() {
  const searchParams = useSearchParams()
  const waitlistId = searchParams.get('waitlist_id')

  const [state, setState] = useState<ClaimState>('loading')
  const [timeSlot, setTimeSlot] = useState('')
  const [firstName, setFirstName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!waitlistId) {
      setState('error')
      setErrorMessage('Invalid claim link.')
      return
    }

    async function claim() {
      try {
        const res = await fetch(`/api/claim?waitlist_id=${waitlistId}`)
        const data = await res.json()

        if (res.ok && data.success) {
          setState('success')
          setTimeSlot(data.timeSlot)
          setFirstName(data.firstName)
        } else if (res.status === 410) {
          setState('expired')
        } else if (res.status === 409 && data.error?.includes('already been claimed')) {
          setState('already_claimed')
        } else {
          setState('error')
          setErrorMessage(data.error || 'Something went wrong.')
        }
      } catch (e) {
        setState('error')
        setErrorMessage('Something went wrong. Please try again.')
      }
    }

    claim()
  }, [waitlistId])

  if (state === 'loading') {
    return (
      <main style={bgStyle}>
        <div style={{ textAlign: 'center' }}>
          <LogoLockup width={280} />
          <p style={{ marginTop: '32px', fontSize: '12px', letterSpacing: '0.2em', color: '#8a7d74', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
            Confirming your spot...
          </p>
        </div>
      </main>
    )
  }

  if (state === 'success') {
    return (
      <main style={bgStyle}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: '32px' }}>
            <LogoLockup width={320} />
          </div>

          <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#7a6e66', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
            You are confirmed{firstName ? `, ${firstName}` : ''}
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '38px', lineHeight: 1.1, marginBottom: '8px', color: '#2a2a2a' }}>
            Where They Don&apos;t<br />Make Roads
          </h1>
          <p style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: '16px', color: '#7a6e66', marginBottom: '32px' }}>
            A New Album by Micah Peay
          </p>

          <div style={{ borderTop: '1px solid #c8bdb2', borderBottom: '1px solid #c8bdb2', padding: '24px 0', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#7a6e66', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Session</span>
              <span style={{ fontSize: '14px', color: '#2a2a2a', fontFamily: 'Georgia, serif' }}>{timeSlot}, June 25th</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#7a6e66', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Location</span>
              <span style={{ fontSize: '14px', color: '#2a2a2a', textAlign: 'right', fontFamily: 'Georgia, serif' }}>2100 Zeno Pl<br />Venice, CA 90291</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#7a6e66', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Duration</span>
              <span style={{ fontSize: '14px', color: '#2a2a2a', fontFamily: 'Georgia, serif' }}>~25 minutes</span>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: '#7a6e66', lineHeight: 1.9, letterSpacing: '0.04em', fontFamily: 'Georgia, serif' }}>
            A confirmation has been sent to your email.<br />
            Please arrive 10 minutes before your session.<br />
            To cancel, use the link in your confirmation email.
          </p>
        </div>
      </main>
    )
  }

  if (state === 'expired') {
    return (
      <main style={bgStyle}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: '32px' }}>
            <LogoLockup width={280} />
          </div>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#7a6e66', marginBottom: '16px', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
            Claim window expired
          </p>
          <p style={{ fontSize: '14px', color: '#5a5048', lineHeight: 1.9, fontFamily: 'Georgia, serif' }}>
            Your 2-hour claim window has passed and this spot has been offered to the next person on the waitlist.
          </p>
        </div>
      </main>
    )
  }

  if (state === 'already_claimed') {
    return (
      <main style={bgStyle}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: '32px' }}>
            <LogoLockup width={280} />
          </div>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#7a6e66', marginBottom: '16px', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
            Already confirmed
          </p>
          <p style={{ fontSize: '14px', color: '#5a5048', lineHeight: 1.9, fontFamily: 'Georgia, serif' }}>
            This spot has already been claimed. Check your email for your confirmation details.
          </p>
        </div>
      </main>
    )
  }

  // Error state
  return (
    <main style={bgStyle}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: '32px' }}>
          <LogoLockup width={280} />
        </div>
        <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#7a6e66', marginBottom: '16px', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
          Something went wrong
        </p>
        <p style={{ fontSize: '14px', color: '#5a5048', lineHeight: 1.9, fontFamily: 'Georgia, serif' }}>
          {errorMessage || 'This link may be invalid or expired. Please contact us if you need help.'}
        </p>
      </div>
    </main>
  )
}

// Fallback shown while the Suspense boundary resolves useSearchParams
function ClaimPageFallback() {
  return (
    <main style={bgStyle}>
      <div style={{ textAlign: 'center' }}>
        <LogoLockup width={280} />
        <p style={{ marginTop: '32px', fontSize: '12px', letterSpacing: '0.2em', color: '#8a7d74', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
          Confirming your spot...
        </p>
      </div>
    </main>
  )
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<ClaimPageFallback />}>
      <ClaimPageInner />
    </Suspense>
  )
}
