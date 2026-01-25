import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/buyer/credits/payfast-return
 *
 * User is redirected here after successful PayFast payment
 * Note: Credits are added via the ITN callback, not here
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const paymentId = searchParams.get('m_payment_id') || ''

  // Determine the country from the referer or default to 'za'
  const referer = request.headers.get('referer') || ''
  const countryMatch = referer.match(/\/([a-z]{2})\/buyer/)
  const country = countryMatch ? countryMatch[1] : 'za'

  // Use NEXT_PUBLIC_BASE_URL for redirects (not request.url which is internal on Render)
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://saleaks.co.za').trim()

  // Redirect to buyer dashboard with success message
  const redirectUrl = new URL(`/${country}/buyer`, baseUrl)
  redirectUrl.searchParams.set('payment', 'success')
  if (paymentId) {
    redirectUrl.searchParams.set('payment_id', paymentId)
  }

  return NextResponse.redirect(redirectUrl)
}

// Also handle POST in case PayFast sends it that way
export async function POST(request: NextRequest) {
  return GET(request)
}
