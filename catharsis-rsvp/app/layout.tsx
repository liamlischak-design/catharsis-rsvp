import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Catharsis Soundrooms — Where Music is Felt',
  description: 'Reserve your listening session for the album release of Where They Don\'t Make Roads by Micah Peay. June 25th, 2026. Venice, CA.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
