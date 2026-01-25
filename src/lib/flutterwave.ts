import crypto from 'crypto'

/**
 * Flutterwave Payment Integration
 *
 * Documentation: https://developer.flutterwave.com/docs
 * Dashboard: https://dashboard.flutterwave.com/
 *
 * Supports 34+ African countries with local payment methods:
 * - Cards (Visa, Mastercard)
 * - Mobile Money (M-Pesa, MTN, etc.)
 * - Bank Transfers
 * - USSD
 */

// Flutterwave API URLs
export const FLUTTERWAVE_API_URL = 'https://api.flutterwave.com/v3'

// Check if using test mode
export function isFlutterwaveTestMode(): boolean {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY || ''
  return secretKey.startsWith('FLWSECK_TEST') || process.env.NODE_ENV === 'development'
}

// Payment data interface
export interface FlutterwavePaymentData {
  tx_ref: string // Our unique transaction reference
  amount: number // In the currency specified
  currency: string // NGN, KES, GHS, ZAR, USD, etc.
  redirect_url: string
  customer: {
    email: string
    phone_number?: string
    name?: string
  }
  customizations?: {
    title?: string
    description?: string
    logo?: string
  }
  meta?: Record<string, string | number>
  payment_options?: string // card, banktransfer, ussd, mobilemoney, etc.
}

// Payment response from Flutterwave
export interface FlutterwavePaymentResponse {
  status: string
  message: string
  data: {
    link: string // Redirect URL for payment
  }
}

// Webhook payload interface
export interface FlutterwaveWebhookPayload {
  event: string // charge.completed, transfer.completed, etc.
  data: {
    id: number
    tx_ref: string
    flw_ref: string
    device_fingerprint: string
    amount: number
    currency: string
    charged_amount: number
    app_fee: number
    merchant_fee: number
    processor_response: string
    auth_model: string
    ip: string
    narration: string
    status: string // successful, failed, pending
    payment_type: string // card, mobilemoney, bank_transfer, etc.
    created_at: string
    account_id: number
    customer: {
      id: number
      name: string
      phone_number: string
      email: string
      created_at: string
    }
    meta?: Record<string, string | number> | null
  }
}

// Verification response
export interface FlutterwaveVerificationResponse {
  status: string
  message: string
  data: {
    id: number
    tx_ref: string
    flw_ref: string
    device_fingerprint: string
    amount: number
    currency: string
    charged_amount: number
    app_fee: number
    merchant_fee: number
    processor_response: string
    auth_model: string
    ip: string
    narration: string
    status: string
    payment_type: string
    created_at: string
    account_id: number
    customer: {
      id: number
      name: string
      phone_number: string
      email: string
    }
    meta?: Record<string, string | number> | null
  }
}

/**
 * Verify Flutterwave webhook signature
 * Flutterwave sends a hash in the verif-hash header
 */
export function verifyFlutterwaveWebhook(
  payload: string,
  receivedHash: string
): boolean {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLUTTERWAVE_SECRET_KEY || ''

  // Flutterwave uses the secret hash directly for comparison
  // The verif-hash header should match your webhook secret
  return receivedHash === secretHash
}

/**
 * Generate a unique transaction reference
 */
export function generateTxRef(prefix: string = 'SN'): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex')
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Initialize a Flutterwave payment
 */
export async function initializeFlutterwavePayment(options: {
  amount: number // In cents (will convert to currency units)
  currency?: string
  email: string
  phone?: string
  name?: string
  txRef?: string
  title?: string
  description?: string
  meta?: Record<string, string | number>
  paymentOptions?: string
}): Promise<{ success: boolean; paymentUrl?: string; txRef: string; error?: string }> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY

  if (!secretKey) {
    return { success: false, txRef: '', error: 'Flutterwave secret key not configured' }
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').trim()
  const txRef = options.txRef || generateTxRef()

  // Determine currency - default to ZAR for South Africa
  const currency = options.currency || 'ZAR'

  // Convert cents to currency units
  const amount = options.amount / 100

  const payload: FlutterwavePaymentData = {
    tx_ref: txRef,
    amount,
    currency,
    redirect_url: `${baseUrl}/api/payments/flutterwave/callback`,
    customer: {
      email: options.email,
      phone_number: options.phone,
      name: options.name,
    },
    customizations: {
      title: options.title || 'SpillNova',
      description: options.description || 'Content Purchase',
      logo: `${baseUrl}/icons/spillnova_floating.png`,
    },
    meta: options.meta,
    payment_options: options.paymentOptions, // 'card,banktransfer,ussd,mobilemoney'
  }

  try {
    const response = await fetch(`${FLUTTERWAVE_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data: FlutterwavePaymentResponse = await response.json()

    if (data.status === 'success' && data.data?.link) {
      return {
        success: true,
        paymentUrl: data.data.link,
        txRef,
      }
    }

    return {
      success: false,
      txRef,
      error: data.message || 'Failed to initialize payment',
    }
  } catch (error) {
    console.error('Flutterwave payment initialization error:', error)
    return {
      success: false,
      txRef,
      error: 'Failed to connect to Flutterwave',
    }
  }
}

/**
 * Verify a Flutterwave transaction by ID
 */
export async function verifyFlutterwaveTransaction(
  transactionId: number | string
): Promise<{
  success: boolean
  status?: 'successful' | 'failed' | 'pending'
  data?: FlutterwaveVerificationResponse['data']
  error?: string
}> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY

  if (!secretKey) {
    return { success: false, error: 'Flutterwave secret key not configured' }
  }

  try {
    const response = await fetch(
      `${FLUTTERWAVE_API_URL}/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const result: FlutterwaveVerificationResponse = await response.json()

    if (result.status === 'success' && result.data) {
      return {
        success: true,
        status: result.data.status as 'successful' | 'failed' | 'pending',
        data: result.data,
      }
    }

    return {
      success: false,
      error: result.message || 'Verification failed',
    }
  } catch (error) {
    console.error('Flutterwave verification error:', error)
    return {
      success: false,
      error: 'Failed to verify transaction',
    }
  }
}

/**
 * Verify a Flutterwave transaction by tx_ref
 */
export async function verifyFlutterwaveByTxRef(
  txRef: string
): Promise<{
  success: boolean
  status?: 'successful' | 'failed' | 'pending'
  data?: FlutterwaveVerificationResponse['data']
  error?: string
}> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY

  if (!secretKey) {
    return { success: false, error: 'Flutterwave secret key not configured' }
  }

  try {
    const response = await fetch(
      `${FLUTTERWAVE_API_URL}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const result: FlutterwaveVerificationResponse = await response.json()

    if (result.status === 'success' && result.data) {
      return {
        success: true,
        status: result.data.status as 'successful' | 'failed' | 'pending',
        data: result.data,
      }
    }

    return {
      success: false,
      error: result.message || 'Verification failed',
    }
  } catch (error) {
    console.error('Flutterwave verification error:', error)
    return {
      success: false,
      error: 'Failed to verify transaction',
    }
  }
}

/**
 * Process Flutterwave webhook payload
 */
export async function processFlutterwaveWebhook(
  payload: FlutterwaveWebhookPayload
): Promise<{
  valid: boolean
  txRef: string
  status: 'successful' | 'failed' | 'pending'
  amount: number // In cents
  currency: string
  flwRef: string
  transactionId: number
  paymentType: string
  customerEmail: string
  meta?: Record<string, string | number> | null
}> {
  // Verify the transaction with Flutterwave
  const verification = await verifyFlutterwaveTransaction(payload.data.id)

  if (!verification.success || !verification.data) {
    throw new Error('Failed to verify Flutterwave transaction')
  }

  // Ensure the amounts match
  if (verification.data.amount !== payload.data.amount) {
    throw new Error('Amount mismatch in Flutterwave webhook')
  }

  return {
    valid: true,
    txRef: payload.data.tx_ref,
    status: verification.data.status as 'successful' | 'failed' | 'pending',
    amount: Math.round(verification.data.amount * 100), // Convert to cents
    currency: verification.data.currency,
    flwRef: verification.data.flw_ref,
    transactionId: verification.data.id,
    paymentType: verification.data.payment_type,
    customerEmail: verification.data.customer.email,
    meta: verification.data.meta,
  }
}

/**
 * Get supported currencies for Flutterwave by country
 */
export const FLUTTERWAVE_CURRENCIES: Record<string, { currency: string; name: string }> = {
  // Africa
  NG: { currency: 'NGN', name: 'Nigerian Naira' },
  GH: { currency: 'GHS', name: 'Ghanaian Cedi' },
  KE: { currency: 'KES', name: 'Kenyan Shilling' },
  UG: { currency: 'UGX', name: 'Ugandan Shilling' },
  TZ: { currency: 'TZS', name: 'Tanzanian Shilling' },
  ZA: { currency: 'ZAR', name: 'South African Rand' },
  ZM: { currency: 'ZMW', name: 'Zambian Kwacha' },
  RW: { currency: 'RWF', name: 'Rwandan Franc' },
  CM: { currency: 'XAF', name: 'Central African CFA Franc' },
  CI: { currency: 'XOF', name: 'West African CFA Franc' },
  SN: { currency: 'XOF', name: 'West African CFA Franc' },
  // International
  US: { currency: 'USD', name: 'US Dollar' },
  GB: { currency: 'GBP', name: 'British Pound' },
  EU: { currency: 'EUR', name: 'Euro' },
}

/**
 * Get currency for a country code
 */
export function getFlutterwaveCurrency(countryCode: string): string {
  return FLUTTERWAVE_CURRENCIES[countryCode.toUpperCase()]?.currency || 'USD'
}

/**
 * Flutterwave supported payment methods by country
 */
export const FLUTTERWAVE_PAYMENT_METHODS: Record<string, string[]> = {
  NG: ['card', 'banktransfer', 'ussd', 'barter'],
  GH: ['card', 'mobilemoney', 'banktransfer'],
  KE: ['card', 'mpesa', 'banktransfer'],
  UG: ['card', 'mobilemoney'],
  TZ: ['card', 'mobilemoney'],
  ZA: ['card', 'banktransfer'],
  ZM: ['card', 'mobilemoney'],
  RW: ['card', 'mobilemoney'],
  // Default for other countries
  DEFAULT: ['card'],
}

/**
 * Get payment methods for a country
 */
export function getFlutterwavePaymentMethods(countryCode: string): string {
  const methods = FLUTTERWAVE_PAYMENT_METHODS[countryCode.toUpperCase()]
    || FLUTTERWAVE_PAYMENT_METHODS.DEFAULT
  return methods.join(',')
}
