import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/buyer/credits/payfast-cancel
 *
 * User is redirected here if they cancel the PayFast payment
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const paymentId = searchParams.get('m_payment_id') || ''

  // Determine the country from the referer or default to 'za'
  const referer = request.headers.get('referer') || ''
  const countryMatch = referer.match(/\/([a-z]{2})\/buyer/)
  const country = countryMatch ? countryMatch[1] : 'za'

  // Redirect to buyer dashboard with cancelled message
  const redirectUrl = new URL(`/${country}/buyer`, request.url)
  redirectUrl.searchParams.set('payment', 'cancelled')
  if (paymentId) {
    redirectUrl.searchParams.set('payment_id', paymentId)
  }

  return NextResponse.redirect(redirectUrl)
}

// Also handle POST in case PayFast sends it that way
export async function POST(request: NextRequest) {
  return GET(request)
}
