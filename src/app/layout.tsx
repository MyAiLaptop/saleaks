import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { AppLayout } from '@/components/AppLayout'
import { PWAProvider } from '@/components/PWAProvider'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'SpillNova - Real Content Marketplace',
  description: 'Buy and sell authentic videos and photos from real people worldwide. Verified real content in a world of AI fakes.',
  keywords: ['real content', 'authentic video', 'verified photos', 'citizen journalism', 'breaking news', 'user generated content', 'sell footage', 'buy real videos'],
  robots: 'index, follow',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SpillNova',
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
    title: 'SpillNova - Real Content Marketplace',
    description: 'Buy and sell authentic videos and photos from real people worldwide. Real content. Real value.',
    type: 'website',
    locale: 'en_US',
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
            `,
          }}
        />
      </head>
      <body className={`${plusJakarta.className} min-h-screen bg-ink-900`}>
        <PWAProvider />
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  )
}
