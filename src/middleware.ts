import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Default country for redirects
const DEFAULT_COUNTRY = 'sa'

// Routes that should be redirected to country-specific versions
const COUNTRY_ROUTES = [
  '/live',
  '/browse',
  '/account',
  '/subscribe',
  '/how-it-works',
  '/pricing',
  '/buyer',
  '/notifications',
  '/discussions',
]

// Routes that should remain at root level (no country prefix)
const GLOBAL_ROUTES = [
  '/terms',
  '/privacy',
  '/canary',
  '/download',
  '/embed',
  '/admin',
  '/api',
  '/_next',
  '/icons',
  '/manifest.json',
  '/sw.js',
  '/offline',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip global routes, API routes, and static files
  for (const route of GLOBAL_ROUTES) {
    if (pathname.startsWith(route)) {
      return NextResponse.next()
    }
  }

  // Skip if already has a country prefix (2-letter code)
  const pathParts = pathname.split('/').filter(Boolean)
  if (pathParts.length > 0 && pathParts[0].length === 2) {
    // Looks like it already has a country code
    return NextResponse.next()
  }

  // Check if this is a route that should be redirected
  for (const route of COUNTRY_ROUTES) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      // Redirect to country-specific route
      const newPath = `/${DEFAULT_COUNTRY}${pathname}`
      const url = request.nextUrl.clone()
      url.pathname = newPath
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
