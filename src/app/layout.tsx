import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { PWAProvider } from '@/components/PWAProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SA Leaks - Anonymous Whistleblower Platform',
  description: 'Safely and anonymously report corruption, fraud, and misconduct in South Africa. Your identity is protected.',
  keywords: ['whistleblower', 'corruption', 'south africa', 'anonymous', 'leaks', 'fraud', 'misconduct'],
  robots: 'index, follow',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SA Leaks',
  },
  icons: {
    icon: [
      { url: '/icons/globecon.png', sizes: 'any' },
      { url: '/icons/globecon.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/globecon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/globecon.png',
  },
  openGraph: {
    title: 'SA Leaks - Anonymous Whistleblower Platform',
    description: 'Safely and anonymously report corruption, fraud, and misconduct in South Africa.',
    type: 'website',
    locale: 'en_ZA',
  },
}

export const viewport: Viewport = {
  themeColor: '#007749',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* No tracking scripts, analytics, or external resources */}
        <meta name="referrer" content="no-referrer" />
        {/* Critical CSS for initial render */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Ensure body background is dark immediately */
              html, body {
                background-color: #0F131A !important;
              }
              /* Header styles - applies to both placeholder and real header */
              header, #header-placeholder {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 100 !important;
                background-color: rgba(0, 0, 0, 0.95) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                backdrop-filter: blur(12px) !important;
                height: 64px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
              }
              /* Hide placeholder once real header exists - using :has() */
              body:has(header) #header-placeholder {
                display: none !important;
              }
              /* Reserve space for fixed header */
              main {
                padding-top: 64px !important;
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-ink-900`}>
        {/* Static header placeholder - shows immediately while React loads */}
        <div
          id="header-placeholder"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '64px',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          }}
        />
        <PWAProvider />
        <Header />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
