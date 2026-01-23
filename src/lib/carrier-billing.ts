/**
 * Carrier Billing Integration for SA Leaks
 *
 * Supports payment via mobile airtime/bill for:
 * - Vodacom
 * - MTN
 * - Telkom
 * - Cell C
 *
 * TODO: Replace placeholder functions with actual aggregator API integration
 * Recommended aggregators: Clickatell, Integrat, PayM8, Peach Payments
 */

// Supported carriers in South Africa
export type Carrier = 'vodacom' | 'mtn' | 'telkom' | 'cellc'

// Payment status
export type CarrierPaymentStatus =
  | 'pending'      // Waiting for user confirmation
  | 'confirmed'    // User confirmed via SMS/USSD
  | 'completed'    // Payment successful
  | 'failed'       // Payment failed
  | 'cancelled'    // User cancelled
  | 'expired'      // Request expired

export interface CarrierBillingConfig {
  // Aggregator API credentials (to be filled in after signing deal)
  aggregatorApiKey: string
  aggregatorApiSecret: string
  aggregatorEndpoint: string

  // Revenue share (carrier typically takes 30-50%)
  carrierSharePercent: number

  // Short code for SMS confirmations
  shortCode: string

  // Webhook URL for payment notifications
  webhookUrl: string
}

export interface CarrierPaymentRequest {
  phoneNumber: string      // User's phone number (e.g., "0821234567" or "+27821234567")
  amount: number           // Amount in cents (ZAR)
  description: string      // What they're buying
  mediaId: string          // ID of the media being purchased
  mediaType: 'file' | 'live'
  reference: string        // Unique transaction reference
}

export interface CarrierPaymentResponse {
  success: boolean
  transactionId?: string
  status: CarrierPaymentStatus
  carrier?: Carrier
  confirmationRequired?: boolean  // True if user needs to confirm via SMS
  message?: string
  error?: string
}

// Default config - to be replaced with real values
const DEFAULT_CONFIG: CarrierBillingConfig = {
  aggregatorApiKey: process.env.CARRIER_BILLING_API_KEY || '',
  aggregatorApiSecret: process.env.CARRIER_BILLING_API_SECRET || '',
  aggregatorEndpoint: process.env.CARRIER_BILLING_ENDPOINT || 'https://api.aggregator.example.com',
  carrierSharePercent: 40, // Carrier takes 40%, you get 60%
  shortCode: process.env.CARRIER_BILLING_SHORT_CODE || '12345',
  webhookUrl: process.env.NEXT_PUBLIC_APP_URL + '/api/payments/carrier-webhook' || '',
}

/**
 * Detect carrier from South African phone number
 */
export function detectCarrier(phoneNumber: string): Carrier | null {
  // Normalize phone number
  const normalized = phoneNumber.replace(/\D/g, '')
  const prefix = normalized.startsWith('27')
    ? normalized.substring(2, 5)
    : normalized.startsWith('0')
      ? normalized.substring(1, 4)
      : normalized.substring(0, 3)

  // South African carrier prefixes
  const vodacomPrefixes = ['60', '61', '62', '63', '64', '65', '66', '71', '72', '73', '74', '75', '76', '79']
  const mtnPrefixes = ['78', '83', '73', '63', '67', '68', '69']
  const telkomPrefixes = ['81', '82']
  const cellcPrefixes = ['84', '74']

  if (vodacomPrefixes.some(p => prefix.startsWith(p))) return 'vodacom'
  if (mtnPrefixes.some(p => prefix.startsWith(p))) return 'mtn'
  if (telkomPrefixes.some(p => prefix.startsWith(p))) return 'telkom'
  if (cellcPrefixes.some(p => prefix.startsWith(p))) return 'cellc'

  return null
}

/**
 * Validate South African phone number
 */
export function isValidSAPhoneNumber(phoneNumber: string): boolean {
  const normalized = phoneNumber.replace(/\D/g, '')

  // SA numbers: 10 digits starting with 0, or 11 digits starting with 27
  if (normalized.length === 10 && normalized.startsWith('0')) return true
  if (normalized.length === 11 && normalized.startsWith('27')) return true

  return false
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const normalized = phoneNumber.replace(/\D/g, '')

  if (normalized.startsWith('0')) {
    return '+27' + normalized.substring(1)
  }
  if (normalized.startsWith('27')) {
    return '+' + normalized
  }
  return '+27' + normalized
}

/**
 * Calculate your revenue after carrier takes their share
 */
export function calculateNetRevenue(
  grossAmount: number,
  carrierSharePercent: number = DEFAULT_CONFIG.carrierSharePercent
): { gross: number; carrierShare: number; netRevenue: number } {
  const carrierShare = Math.floor(grossAmount * carrierSharePercent / 100)
  const netRevenue = grossAmount - carrierShare

  return {
    gross: grossAmount,
    carrierShare,
    netRevenue,
  }
}

/**
 * Initiate a carrier billing payment
 *
 * TODO: Replace with actual aggregator API call
 * This is a placeholder that simulates the flow
 */
export async function initiateCarrierPayment(
  request: CarrierPaymentRequest,
  _config: CarrierBillingConfig = DEFAULT_CONFIG
): Promise<CarrierPaymentResponse> {
  // Validate phone number
  if (!isValidSAPhoneNumber(request.phoneNumber)) {
    return {
      success: false,
      status: 'failed',
      error: 'Invalid South African phone number',
    }
  }

  // Detect carrier
  const carrier = detectCarrier(request.phoneNumber)
  if (!carrier) {
    return {
      success: false,
      status: 'failed',
      error: 'Could not detect carrier. Please use a valid SA mobile number.',
    }
  }

  // TODO: Replace this placeholder with actual API call to aggregator
  // Example integration with Clickatell or similar:
  //
  // const response = await fetch(config.aggregatorEndpoint + '/payments/initiate', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${config.aggregatorApiKey}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     msisdn: formatPhoneNumber(request.phoneNumber),
  //     amount: request.amount,
  //     currency: 'ZAR',
  //     description: request.description,
  //     reference: request.reference,
  //     webhook_url: config.webhookUrl,
  //   }),
  // })

  // Placeholder response - simulates pending confirmation
  console.log('[Carrier Billing] Payment initiated:', {
    carrier,
    phone: formatPhoneNumber(request.phoneNumber),
    amount: request.amount / 100, // Convert cents to Rands
    reference: request.reference,
  })

  return {
    success: true,
    transactionId: `CB-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    status: 'pending',
    carrier,
    confirmationRequired: true,
    message: `Please confirm the R${(request.amount / 100).toFixed(2)} payment on your ${carrier.toUpperCase()} phone. You will receive an SMS shortly.`,
  }
}

/**
 * Check payment status
 *
 * TODO: Replace with actual aggregator API call
 */
export async function checkPaymentStatus(
  transactionId: string,
  _config: CarrierBillingConfig = DEFAULT_CONFIG
): Promise<CarrierPaymentResponse> {
  // TODO: Replace with actual API call
  //
  // const response = await fetch(config.aggregatorEndpoint + `/payments/${transactionId}/status`, {
  //   headers: {
  //     'Authorization': `Bearer ${config.aggregatorApiKey}`,
  //   },
  // })

  console.log('[Carrier Billing] Checking status for:', transactionId)

  // Placeholder - in real implementation, this would query the aggregator
  return {
    success: true,
    transactionId,
    status: 'pending',
    message: 'Waiting for user confirmation',
  }
}

/**
 * Process webhook from aggregator
 * Called when carrier confirms/denies payment
 *
 * TODO: Implement based on your chosen aggregator's webhook format
 */
export interface CarrierWebhookPayload {
  transactionId: string
  status: CarrierPaymentStatus
  carrier: Carrier
  phoneNumber: string
  amount: number
  reference: string
  timestamp: string
  signature?: string
}

export function verifyWebhookSignature(
  payload: CarrierWebhookPayload,
  signature: string,
  _secret: string = DEFAULT_CONFIG.aggregatorApiSecret
): boolean {
  // TODO: Implement signature verification based on aggregator's method
  // Usually HMAC-SHA256 of the payload

  console.log('[Carrier Billing] Verifying webhook signature:', {
    transactionId: payload.transactionId,
    providedSignature: signature,
  })

  // Placeholder - always returns true
  // In production, verify the signature!
  return true
}

/**
 * Get carrier display name
 */
export function getCarrierDisplayName(carrier: Carrier): string {
  const names: Record<Carrier, string> = {
    vodacom: 'Vodacom',
    mtn: 'MTN',
    telkom: 'Telkom',
    cellc: 'Cell C',
  }
  return names[carrier] || carrier
}

/**
 * Check if carrier billing is configured and ready
 */
export function isCarrierBillingEnabled(): boolean {
  return !!(
    process.env.CARRIER_BILLING_API_KEY &&
    process.env.CARRIER_BILLING_API_SECRET
  )
}
