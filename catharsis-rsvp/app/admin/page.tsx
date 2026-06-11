'use client'

import { useState } from 'react'

interface RSVP {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  time_slot: string
  cancelled: boolean
  created_at: string
}

const TIME_SLOTS = ['6:30 PM', '7:10 PM', '7:50 PM', '8:30 PM', '9:10 PM', '9:50 PM']

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | string>('all')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${password}` },
      })
      if (!res.ok) { setError('Incorrect password.'); setLoading(false); return }
      const data = await res.json()
      setRsvps(data)
      setAuthed(true)
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all' ? rsvps : rsvps.filter(r => r.time_slot === filter)
  const active = (slot: string) => rsvps.filter(r => r.time_slot === slot && !r.cancelled).length

  if (!authed) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: '320px', width: '100%' }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#666', marginBottom: '20px', textTransform: 'uppercase' }}>
          Admin Access
        </p>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '28px', marginBottom: '32px' }}>
          Catharsis Soundrooms
        </p>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ marginBottom: '12px' }}
          />
          {error && <p style={{ fontSize: '12px', color: '#cc4444', marginBottom: '12px' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ background: '#fff', border: 'none', color: '#000', fontSize: '11px', fontWeight: 500, letterSpacing: '0.15em', padding: '14px 24px', textTransform: 'uppercase', width: '100%', cursor: 'pointer' }}
          >
            {loading ? 'Loading...' : 'Enter'}
          </button>
        </form>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#666', marginBottom: '8px', textTransform: 'uppercase' }}>Admin</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '32px', marginBottom: '24px' }}>
            Where They Don&apos;t Make Roads — June 25th
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
            {TIME_SLOTS.map(slot => (
              <div key={slot} style={{ border: '1px solid #1a1a1a', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>{slot}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>{active(slot)}/7</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '24px' }}>
            Total active RSVPs: {rsvps.filter(r => !r.cancelled).length} / 42
          </p>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', ...TIME_SLOTS].map(slot => (
            <button
              key={slot}
              onClick={() => setFilter(slot)}
              style={{
                background: filter === slot ? '#fff' : 'transparent',
                border: '1px solid',
                borderColor: filter === slot ? '#fff' : '#333',
                color: filter === slot ? '#000' : '#888',
                fontSize: '10px',
                letterSpacing: '0.1em',
                padding: '8px 14px',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {slot === 'all' ? 'All' : slot}
            </button>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #1a1a1a' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 0.8fr', gap: '16px', padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
            {['Name', 'Email', 'Phone', 'Session', 'Status'].map(h => (
              <span key={h} style={{ fontSize: '10px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>
          {filtered.length === 0 && (
            <p style={{ fontSize: '13px', color: '#555', padding: '24px 0' }}>No RSVPs yet.</p>
          )}
          {filtered.map(r => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 0.8fr', gap: '16px', padding: '14px 0', borderBottom: '1px solid #111', opacity: r.cancelled ? 0.4 : 1 }}>
              <span style={{ fontSize: '13px' }}>{r.first_name} {r.last_name}</span>
              <span style={{ fontSize: '12px', color: '#888', wordBreak: 'break-all' }}>{r.email}</span>
              <span style={{ fontSize: '12px', color: '#888' }}>{r.phone}</span>
              <span style={{ fontSize: '12px' }}>{r.time_slot}</span>
              <span style={{ fontSize: '11px', color: r.cancelled ? '#555' : '#888', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {r.cancelled ? 'Cancelled' : 'Active'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
