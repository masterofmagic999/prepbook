import type { Metadata } from 'next'
import './globals.css'
import NavWrapper from '@/components/NavWrapper'

export const metadata: Metadata = {
  title: 'PrepBook - AP World History',
  description: 'Your complete AP World History practice hub',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="min-h-screen bg-gray-50">
          <NavWrapper>
            {children}
          </NavWrapper>
        </div>
      </body>
    </html>
  )
}
