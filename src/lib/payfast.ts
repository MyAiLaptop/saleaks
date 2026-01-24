import crypto from 'crypto'

/**
 * PayFast Payment Integration
 *
 * Sandbox: https://sandbox.payfast.co.za
 * Production: https://www.payfast.co.za
 */

// PayFast URLs
export const PAYFAST_SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process'
export const PAYFAST_PRODUCTION_URL = 'https://www.payfast.co.za/eng/process'
export const PAYFAST_SANDBOX_VALIDATE_URL = 'https://sandbox.payfast.co.za/eng/query/validate'
export const PAYFAST_PRODUCTION_VALIDATE_URL = 'https://www.payfast.co.za/eng/query/validate'

// Check if using sandbox
export function isPayFastSandbox(): boolean {
  return process.env.PAYFAST_SANDBOX === 'true' || process.env.NODE_ENV === 'development'
}

// Get PayFast URL based on environment
export function getPayFastUrl(): string {
  return isPayFastSandbox() ? PAYFAST_SANDBOX_URL : PAYFAST_PRODUCTION_URL
}

export function getPayFastValidateUrl(): string {
  return isPayFastSandbox() ? PAYFAST_SANDBOX_VALIDATE_URL : PAYFAST_PRODUCTION_VALIDATE_URL
}

// PayFast payment data interface
export interface PayFastPaymentData {
  // Merchant details
  merchant_id: string
  merchant_key: string

  // URLs
  return_url: string
  cancel_url: string
  notify_url: string

  // Buyer details (optional)
  name_first?: string
  name_last?: string
  email_address?: string
  cell_number?: string

  // Transaction details
  m_payment_id: string // Our unique payment ID
  amount: string // In Rands (e.g., "100.00")
  item_name: string
  item_description?: string

  // Custom fields for tracking
  custom_str1?: string // buyerId
  custom_str2?: string // packageId
  custom_str3?: string
  custom_str4?: string
  custom_str5?: string
  custom_int1?: number
  custom_int2?: number
  custom_int3?: number
  custom_int4?: number
  custom_int5?: number

  // Payment options
  email_confirmation?: '0' | '1'
  confirmation_address?: string
  payment_method?: 'eft' | 'cc' | 'dc' | 'mp' | 'mc' | 'sc' | 'zp'
}

/**
 * Generate MD5 signature for PayFast payment data
 *
 * PayFast requires a specific order of fields and MD5 hash
 */
export function generatePayFastSignature(
  data: Record<string, string | number | undefined>,
  passphrase?: string
): string {
  // Fields must be in this specific order for signature
  const signatureFields = [
    'merchant_id',
    'merchant_key',
    'return_url',
    'cancel_url',
    'notify_url',
    'name_first',
    'name_last',
    'email_address',
    'cell_number',
    'm_payment_id',
    'amount',
    'item_name',
    'item_description',
    'custom_int1',
    'custom_int2',
    'custom_int3',
    'custom_int4',
    'custom_int5',
    'custom_str1',
    'custom_str2',
    'custom_str3',
    'custom_str4',
    'custom_str5',
    'email_confirmation',
    'confirmation_address',
    'payment_method',
  ]

  // Build signature string from ordered fields
  let signatureString = ''

  for (const field of signatureFields) {
    const value = data[field]
    if (value !== undefined && value !== null && value !== '') {
      // URL encode the value
      const encodedValue = encodeURIComponent(String(value).trim()).replace(/%20/g, '+')
      signatureString += `${field}=${encodedValue}&`
    }
  }

  // Remove trailing &
  signatureString = signatureString.slice(0, -1)

  // Add passphrase if provided (required for production)
  if (passphrase) {
    signatureString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`
  }

  // Generate MD5 hash
  return crypto.createHash('md5').update(signatureString).digest('hex')
}

/**
 * Verify PayFast ITN (Instant Transaction Notification) signature
 */
export function verifyPayFastSignature(
  data: Record<string, string>,
  receivedSignature: string,
  passphrase?: string
): boolean {
  // Remove signature from data before calculating
  const { signature, ...dataWithoutSignature } = data

  // Generate our own signature
  const calculatedSignature = generatePayFastSignature(dataWithoutSignature, passphrase)

  return calculatedSignature === receivedSignature
}

/**
 * Create PayFast payment request data
 */
export function createPayFastPayment(options: {
  paymentId: string
  amount: number // In cents
  itemName: string
  itemDescription?: string
  buyerId: string
  packageId: string
  buyerEmail?: string
  buyerPhone?: string
  buyerName?: string
}): { url: string; redirectUrl: string; data: Record<string, string>; signature: string } {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const merchantId = process.env.PAYFAST_MERCHANT_ID || ''
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY || ''
  const passphrase = process.env.PAYFAST_PASSPHRASE || ''

  // Build payment data
  const paymentData: Record<string, string | number | undefined> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: `${baseUrl}/api/buyer/credits/payfast-return`,
    cancel_url: `${baseUrl}/api/buyer/credits/payfast-cancel`,
    notify_url: `${baseUrl}/api/buyer/credits/payfast-notify`,
    m_payment_id: options.paymentId,
    amount: (options.amount / 100).toFixed(2), // Convert cents to Rands
    item_name: options.itemName,
    item_description: options.itemDescription,
    custom_str1: options.buyerId,
    custom_str2: options.packageId,
    email_confirmation: '1',
  }

  // Add buyer details if available
  if (options.buyerEmail) {
    paymentData.email_address = options.buyerEmail
  }
  if (options.buyerPhone) {
    paymentData.cell_number = options.buyerPhone
  }
  if (options.buyerName) {
    const nameParts = options.buyerName.split(' ')
    paymentData.name_first = nameParts[0]
    if (nameParts.length > 1) {
      paymentData.name_last = nameParts.slice(1).join(' ')
    }
  }

  // Convert to string record (remove empty values)
  const formData: Record<string, string> = {}
  for (const [key, value] of Object.entries(paymentData)) {
    if (value !== undefined && value !== null && value !== '') {
      formData[key] = String(value)
    }
  }

  // Generate signature from filtered data
  const signature = generatePayFastSignature(formData, passphrase)
  formData.signature = signature

  // Build redirect URL with GET parameters (like the working Python implementation)
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(formData)) {
    params.append(key, value)
  }
  const redirectUrl = `${getPayFastUrl()}?${params.toString()}`

  return {
    url: getPayFastUrl(),
    redirectUrl, // Use this for direct redirect (GET method)
    data: formData,
    signature,
  }
}

/**
 * Validate PayFast ITN request
 * Returns the parsed and validated payment data, or throws an error
 */
export async function validatePayFastITN(
  data: Record<string, string>
): Promise<{
  valid: boolean
  paymentId: string
  buyerId: string
  packageId: string
  amount: number // In cents
  status: 'COMPLETE' | 'FAILED' | 'PENDING'
  pfPaymentId: string
}> {
  const passphrase = process.env.PAYFAST_PASSPHRASE || ''

  // 1. Verify signature
  const receivedSignature = data.signature
  if (!verifyPayFastSignature(data, receivedSignature, passphrase)) {
    throw new Error('Invalid PayFast signature')
  }

  // 2. Verify payment status
  const paymentStatus = data.payment_status
  let status: 'COMPLETE' | 'FAILED' | 'PENDING'

  if (paymentStatus === 'COMPLETE') {
    status = 'COMPLETE'
  } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
    status = 'FAILED'
  } else {
    status = 'PENDING'
  }

  // 3. Verify with PayFast server (optional but recommended for production)
  if (!isPayFastSandbox()) {
    const validateUrl = getPayFastValidateUrl()
    const params = new URLSearchParams(data)

    const response = await fetch(validateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const result = await response.text()
    if (result !== 'VALID') {
      throw new Error('PayFast validation failed')
    }
  }

  return {
    valid: true,
    paymentId: data.m_payment_id,
    buyerId: data.custom_str1,
    packageId: data.custom_str2,
    amount: Math.round(parseFloat(data.amount_gross) * 100), // Convert to cents
    status,
    pfPaymentId: data.pf_payment_id,
  }
}

/**
 * PayFast sandbox credentials from your dashboard
 */
export const PAYFAST_SANDBOX_CREDENTIALS = {
  merchant_id: '10036502',
  merchant_key: 'gjiti7uco8ujm',
  passphrase: 'moveondropzone',
}

/**
 * Valid PayFast IP addresses (for ITN verification in production)
 */
export const PAYFAST_VALID_IPS = [
  '197.97.145.144',
  '197.97.145.145',
  '197.97.145.146',
  '197.97.145.147',
  '197.97.145.148',
  '197.97.145.149',
  '197.97.145.150',
  '197.97.145.151',
  '197.97.145.152',
  '197.97.145.153',
  '197.97.145.154',
  '41.74.179.194',
  '41.74.179.195',
  '41.74.179.196',
  '41.74.179.197',
  '41.74.179.198',
  '41.74.179.199',
  '41.74.179.200',
  '41.74.179.201',
  '41.74.179.202',
  '41.74.179.203',
  '41.74.179.204',
]

/**
 * Verify if an IP address is from PayFast
 */
export function isValidPayFastIP(ip: string): boolean {
  // In sandbox mode, be lenient with IPs
  if (isPayFastSandbox()) {
    return true
  }
  return PAYFAST_VALID_IPS.includes(ip)
}
