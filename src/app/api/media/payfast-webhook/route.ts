import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { creditSubmitterEarning } from '@/lib/submitter-earnings'

// PayFast configuration
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || ''
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || ''

// PayFast sandbox and production IPs
const PAYFAST_IPS = [
  '197.97.145.144',
  '197.97.145.145',
  '197.97.145.146',
  '197.97.145.147',
  '197.97.145.148',
  '197.97.145.149',
  '197.97.145.150',
  '197.97.145.151',
  '41.74.179.194', // Sandbox
]

// Verify PayFast signature
function verifySignature(data: Record<string, string>, signature: string, passPhrase?: string): boolean {
  // Remove signature from data for verification
  const dataWithoutSignature = { ...data }
  delete dataWithoutSignature.signature

  // Create parameter string
  const paramString = Object.keys(dataWithoutSignature)
    .sort()
    .filter(key => dataWithoutSignature[key] !== '')
    .map(key => `${key}=${encodeURIComponent(dataWithoutSignature[key]).replace(/%20/g, '+')}`)
    .join('&')

  // Add passphrase if provided
  const stringToHash = passPhrase ? `${paramString}&passphrase=${encodeURIComponent(passPhrase)}` : paramString

  const calculatedSignature = crypto.createHash('md5').update(stringToHash).digest('hex')

  return calculatedSignature === signature
}

// Verify payment with PayFast server
async function verifyPaymentWithPayFast(data: Record<string, string>): Promise<boolean> {
  try {
    const verifyUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.payfast.co.za/eng/query/validate'
      : 'https://sandbox.payfast.co.za/eng/query/validate'

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(data).toString(),
    })

    const result = await response.text()
    return result === 'VALID'
  } catch (error) {
    console.error('PayFast verification error:', error)
    return false
  }
}

// POST /api/media/payfast-webhook - PayFast ITN handler
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Verify IP (only in production)
    if (process.env.NODE_ENV === 'production' && !PAYFAST_IPS.includes(clientIp)) {
      console.error('Invalid PayFast IP:', clientIp)
      return new NextResponse('Invalid source IP', { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const data: Record<string, string> = {}

    formData.forEach((value, key) => {
      data[key] = value.toString()
    })

    console.log('PayFast ITN received:', {
      payment_status: data.payment_status,
      m_payment_id: data.m_payment_id,
      pf_payment_id: data.pf_payment_id,
    })

    // Extract key fields
    const {
      m_payment_id: purchaseId,
      pf_payment_id: payfastPaymentId,
      payment_status: paymentStatus,
      amount_gross: amountGross,
      signature,
      custom_str1: downloadToken,
    } = data

    // Verify signature
    if (!verifySignature(data, signature, PAYFAST_PASSPHRASE || undefined)) {
      console.error('Invalid PayFast signature')
      return new NextResponse('Invalid signature', { status: 400 })
    }

    // Get purchase record
    const purchase = await prisma.mediaPurchase.findUnique({
      where: { id: purchaseId },
    })

    if (!purchase) {
      console.error('Purchase not found:', purchaseId)
      return new NextResponse('Purchase not found', { status: 404 })
    }

    // Verify amount matches
    const expectedAmount = (purchase.amount / 100).toFixed(2)
    if (amountGross !== expectedAmount) {
      console.error('Amount mismatch:', { expected: expectedAmount, received: amountGross })
      return new NextResponse('Amount mismatch', { status: 400 })
    }

    // Verify merchant ID
    if (data.merchant_id !== PAYFAST_MERCHANT_ID) {
      console.error('Merchant ID mismatch')
      return new NextResponse('Invalid merchant', { status: 400 })
    }

    // Verify with PayFast server (optional but recommended)
    const isValidPayment = await verifyPaymentWithPayFast(data)
    if (!isValidPayment) {
      console.error('PayFast server verification failed')
      // Continue anyway in sandbox mode
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Payment verification failed', { status: 400 })
      }
    }

    // Update purchase based on status
    if (paymentStatus === 'COMPLETE') {
      await prisma.mediaPurchase.update({
        where: { id: purchaseId },
        data: {
          status: 'COMPLETED',
          paymentId: payfastPaymentId,
        }
      })

      console.log('Payment completed:', purchaseId)

      // Credit the submitter's account if linked
      const mediaType = purchase.liveMediaId ? 'live' : 'file'
      const mediaId = purchase.liveMediaId || purchase.fileId
      if (mediaId) {
        const creditResult = await creditSubmitterEarning({
          purchaseId,
          mediaType,
          mediaId,
        })
        console.log('Submitter credit result:', creditResult)
      }

      // TODO: Send email with download link
      // await sendDownloadEmail(purchase.email, downloadToken)

    } else if (paymentStatus === 'CANCELLED') {
      await prisma.mediaPurchase.update({
        where: { id: purchaseId },
        data: { status: 'CANCELLED' }
      })
    } else if (paymentStatus === 'PENDING') {
      // Payment is pending, no action needed
      console.log('Payment pending:', purchaseId)
    }

    // Return 200 OK to acknowledge receipt
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('PayFast webhook error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
