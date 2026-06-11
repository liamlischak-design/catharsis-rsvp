export default function PrivacyPage() {
  const h2Style = { fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '20px', marginBottom: '12px', marginTop: '32px' }
  const pStyle = { fontSize: '13px', color: '#888', lineHeight: 1.9, letterSpacing: '0.02em', marginBottom: '12px' }

  return (
    <main style={{ minHeight: '100vh', padding: '60px 24px 80px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#666', marginBottom: '12px', textTransform: 'uppercase' }}>
          Catharsis Soundrooms
        </p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '36px', marginBottom: '40px' }}>
          Privacy Policy
        </h1>

        <p style={pStyle}>Last updated: June 2026</p>

        <h2 style={h2Style}>Information We Collect</h2>
        <p style={pStyle}>When you RSVP for a Catharsis Soundrooms event, we collect your first and last name, phone number, and email address. This information is used solely to manage your reservation and send event-related communications.</p>

        <h2 style={h2Style}>How We Use Your Information</h2>
        <p style={pStyle}>Your information is used to confirm your reservation, send SMS reminders about the event, and communicate any changes to event details. We do not sell, share, or transfer your personal information to third parties for marketing purposes.</p>

        <h2 style={h2Style}>SMS Communications</h2>
        <p style={pStyle}>By submitting an RSVP, you consent to receive SMS messages related to your reservation, including confirmation and reminder messages. Message frequency varies. Message and data rates may apply. Reply STOP at any time to opt out of SMS communications. Reply HELP for assistance.</p>
        <p style={pStyle}>We do not share your mobile number with third parties for their marketing purposes.</p>

        <h2 style={h2Style}>Data Storage</h2>
        <p style={pStyle}>Your reservation data is stored securely and is retained only as long as necessary to fulfill the purpose for which it was collected.</p>

        <h2 style={h2Style}>Contact</h2>
        <p style={pStyle}>For privacy-related questions, contact us at hello@catharsis.fm</p>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #111' }}>
          <a href="/" style={{ fontSize: '10px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>← Back to RSVP</a>
        </div>
      </div>
    </main>
  )
}
