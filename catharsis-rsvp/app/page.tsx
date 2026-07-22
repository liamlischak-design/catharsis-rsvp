'use client'

import { useState } from 'react'

function LogoLockup({ width = 480 }: { width?: number }) {
  return (
    <div style={{ width: '100%', maxWidth: width, margin: '0 auto' }}>
      <img
        src="/catharsis-lockup.svg?v=3"
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
      className="turrell-field gate-layout"
      style={{
        minHeight: '118vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <div style={{ width: 'min(94vw, 760px)' }}>
        <LogoLockup width={760} />
      </div>

      <div
        style={{
          marginTop: 'clamp(40px, 7vh, 80px)',
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
                fontSize: 'clamp(12px, 3.2vw, 18px)',
                letterSpacing: '0.08em',
                color: '#5a4e45',
                marginBottom: '20px',
              }}
            >
              Join the list for the next album experience.
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
                borderBottom: `1px solid ${status === 'error' ? '#cc4444' : '#ffffff'}`,
                color: '#ffffff',
                WebkitTextFillColor: '#ffffff',
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
                background: '#ffffff',
                border: '1px solid #ffffff',
                borderRadius: '50% 50% 40px 40px',
                color: '#2a2a2a',
                cursor: status === 'loading' ? 'default' : 'pointer',
                fontSize: '12px',
                letterSpacing: '0.16em',
                marginTop: '32px',
                padding: '22px 30px 20px',
                textTransform: 'uppercase',
                opacity: status === 'loading' ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ position: 'relative', top: '1px' }}>
                {status === 'loading' ? 'sending' : 'join the list'}
              </span>
            </button>
          </form>
        )}
      </div>

      <div
        style={{
          borderTop: '1px solid #c8bdb2',
          marginTop: 'auto',
          width: '100%',
          maxWidth: '900px',
          padding: '32px 24px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span className="footer-copyright" style={{ fontSize: '10px', color: '#ffffff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          &copy; {new Date().getFullYear()} Catharsis Soundrooms, LLC. All rights reserved.
        </span>
        <div className="footer-links" style={{ display: 'flex', gap: '24px' }}>
          <a href="/privacy" style={{ fontSize: '10px', color: '#ffffff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: '10px', color: '#ffffff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Terms</a>
        </div>
      </div>
    </main>
  )
}
