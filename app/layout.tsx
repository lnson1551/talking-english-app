import type { Metadata } from 'next'
// import { Inter } from 'next/font/google' // Removed Inter font
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Talking English App',
  description: 'Real-time voice chat application for English practice',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background font-sans antialiased"> {/* Apply dark background and new font */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 