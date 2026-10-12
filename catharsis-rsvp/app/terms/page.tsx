export default function TermsPage() {
  const h2Style = { fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '20px', marginBottom: '12px', marginTop: '32px' }
  const pStyle = { fontSize: '13px', color: '#888', lineHeight: 1.9, letterSpacing: '0.02em', marginBottom: '12px' }

  return (
    <main style={{ minHeight: '100vh', padding: '60px 24px 80px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#666', marginBottom: '12px', textTransform: 'uppercase' }}>
          Catharsis Soundrooms
        </p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '36px', marginBottom: '40px' }}>
          Terms & Conditions
        </h1>

        <p style={pStyle}>Last updated: October 2026</p>

        <h2 style={h2Style}>Reservations</h2>
        <p style={pStyle}>RSVPs are complimentary and do not require payment. Each reservation is for one named individual. By reserving a spot, you agree to arrive at least 10 minutes before your scheduled session time. Late arrivals may not be admitted once the session has begun.</p>

        <h2 style={h2Style}>Cancellations</h2>
        <p style={pStyle}>You may cancel your reservation at any time using the link provided in your confirmation SMS. Cancellations free up your spot for other guests. We appreciate advance notice if you are unable to attend.</p>

        <h2 style={h2Style}>Event Experience</h2>
        <p style={pStyle}>Catharsis Soundrooms presents an immersive listening experience designed for focused, uninterrupted engagement with recorded music. Out of respect for other attendees, phone use and disruptive behavior during sessions is not permitted.</p>

        <h2 style={h2Style}>Liability</h2>
        <p style={pStyle}>Attendance at Catharsis Soundrooms events is at your own risk. We are not responsible for personal injury, property damage, or loss of any kind arising from attendance at our events.</p>

        <h2 style={h2Style}>Changes to Events</h2>
        <p style={pStyle}>Catharsis Soundrooms reserves the right to modify, postpone, or cancel events. In the event of a cancellation, we will make reasonable efforts to notify registered attendees.</p>

        <h2 style={h2Style}>Contact</h2>
        <p style={pStyle}>For questions about these terms, contact us at liam@catharsissoundrooms.com</p>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #111' }}>
          <a href="/" style={{ fontSize: '10px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>← Back to RSVP</a>
        </div>
      </div>
    </main>
  )
}
