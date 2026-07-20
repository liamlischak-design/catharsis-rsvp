'use client'

import { useState } from 'react'

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
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
        return
      }
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <main
      className="turrell-field"
      style={{
        position: 'relative',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Logo sits exactly at the gradient's center point (50%, 50%) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(80vw, 876px)',
        }}
      >
        <LogoLockup width={876} />
      </div>

      {/* Signup content is anchored a fixed distance below that same center point */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(50% + 96px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '680px',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        {status === 'done' ? (
          <p
            style={{
              fontSize: '13px',
              letterSpacing: '0.2em',
              color: '#5a4e45',
              textTransform: 'uppercase',
            }}
          >
            You&rsquo;re on the list.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p
              style={{
                fontSize: 'clamp(14px, 4vw, 18px)',
                letterSpacing: '0.08em',
                color: '#5a4e45',
                marginBottom: '20px',
              }}
            >
              Join the list for the next album experience
            </p>
            <input
              type="email"
              placeholder="email address"
              value={email}
              required
              onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${status === 'error' ? '#cc4444' : '#8a7d74'}`,
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
            {status === 'error' && (
              <p style={{ fontSize: '11px', color: '#cc4444', letterSpacing: '0.1em', marginBottom: '8px' }}>
                {message}
              </p>
            )}
            <button
              type="submit"
              className="pulse-btn"
              disabled={status === 'loading'}
              style={{
                background: 'transparent',
                border: '1px solid #8a7d74',
                borderRadius: '999px',
                color: '#5a4e45',
                cursor: status === 'loading' ? 'default' : 'pointer',
                fontSize: '13px',
                letterSpacing: '0.25em',
                marginTop: '28px',
                padding: '14px 48px',
                textTransform: 'uppercase',
                opacity: status === 'loading' ? 0.6 : 1,
              }}
            >
              {status === 'loading' ? 'sending' : 'join the list'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
