import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TechInSight',
  description: 'AI/ML powered document management with embeddings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
