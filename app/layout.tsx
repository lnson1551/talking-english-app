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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="bg-background font-sans antialiased"> {/* Apply dark background and new font */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 