/**
 * OTP (One-Time Password) System for SpillNova
 *
 * Used for:
 * - Submitter account verification
 * - Secure login without passwords
 * - Withdrawal confirmations
 */

import { prisma } from '@/lib/db'
import { formatPhoneNumber, isValidSAPhoneNumber } from '@/lib/carrier-billing'

// OTP configuration
const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 5
const MAX_ATTEMPTS = 3
const COOLDOWN_SECONDS = 60 // Wait 60 seconds between OTP requests

export type OtpPurpose = 'VERIFY_ACCOUNT' | 'LOGIN' | 'WITHDRAW' | 'BUYER_VERIFY' | 'BUYER_LOGIN'

/**
 * Generate a random numeric OTP
 */
export function generateOtpCode(length: number = OTP_LENGTH): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

/**
 * Create and store a new OTP for a phone number
 */
export async function createOtp(
  phoneNumber: string,
  purpose: OtpPurpose
): Promise<{ success: boolean; code?: string; error?: string; cooldownRemaining?: number }> {
  // Validate phone number
  if (!isValidSAPhoneNumber(phoneNumber)) {
    return { success: false, error: 'Invalid South African phone number' }
  }

  const normalizedPhone = formatPhoneNumber(phoneNumber)

  // Check for recent OTP (cooldown)
  const recentOtp = await prisma.otpCode.findFirst({
    where: {
      phoneNumber: normalizedPhone,
      purpose,
      createdAt: {
        gte: new Date(Date.now() - COOLDOWN_SECONDS * 1000),
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (recentOtp) {
    const cooldownRemaining = Math.ceil(
      (recentOtp.createdAt.getTime() + COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
    )
    return {
      success: false,
      error: `Please wait ${cooldownRemaining} seconds before requesting another code`,
      cooldownRemaining,
    }
  }

  // Invalidate any existing unused OTPs for this phone/purpose
  await prisma.otpCode.updateMany({
    where: {
      phoneNumber: normalizedPhone,
      purpose,
      used: false,
    },
    data: { used: true },
  })

  // Generate new OTP
  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.otpCode.create({
    data: {
      phoneNumber: normalizedPhone,
      code,
      purpose,
      expiresAt,
      maxAttempts: MAX_ATTEMPTS,
    },
  })

  // TODO: Send OTP via SMS using carrier billing aggregator or SMS gateway
  // For now, we log it (in production, send via SMS)
  console.log(`[OTP] Code for ${normalizedPhone}: ${code} (expires in ${OTP_EXPIRY_MINUTES} minutes)`)

  return { success: true, code }
}

// Test bypass code - remove in production when SMS is live
const TEST_BYPASS_CODE = '000000'
const ENABLE_TEST_BYPASS = process.env.ENABLE_OTP_BYPASS === 'true' || process.env.NODE_ENV === 'development'

/**
 * Verify an OTP code
 */
export async function verifyOtp(
  phoneNumber: string,
  code: string,
  purpose: OtpPurpose
): Promise<{ success: boolean; error?: string }> {
  const normalizedPhone = formatPhoneNumber(phoneNumber)

  // Test bypass: allow 000000 when SMS service isn't configured
  if (ENABLE_TEST_BYPASS && code === TEST_BYPASS_CODE) {
    console.log(`[OTP] Test bypass used for ${normalizedPhone} (purpose: ${purpose})`)
    return { success: true }
  }

  // Find the OTP
  const otp = await prisma.otpCode.findFirst({
    where: {
      phoneNumber: normalizedPhone,
      purpose,
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) {
    return { success: false, error: 'No valid OTP found. Please request a new code.' }
  }

  // Check attempts
  if (otp.attempts >= otp.maxAttempts) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    })
    return { success: false, error: 'Too many attempts. Please request a new code.' }
  }

  // Verify code
  if (otp.code !== code) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 },
    })
    const remaining = otp.maxAttempts - otp.attempts - 1
    return {
      success: false,
      error: `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
    }
  }

  // Mark as used
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true, usedAt: new Date() },
  })

  return { success: true }
}

/**
 * Send OTP via SMS
 * TODO: Integrate with SMS provider (Clickatell, BulkSMS, etc.)
 */
export async function sendOtpSms(
  phoneNumber: string,
  code: string,
  purpose: OtpPurpose
): Promise<boolean> {
  const normalizedPhone = formatPhoneNumber(phoneNumber)

  let message: string
  switch (purpose) {
    case 'VERIFY_ACCOUNT':
      message = `Your SpillNova verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
      break
    case 'LOGIN':
      message = `Your SpillNova login code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
      break
    case 'WITHDRAW':
      message = `Your SpillNova withdrawal confirmation code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
      break
    case 'BUYER_VERIFY':
      message = `Your SpillNova Buyer verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
      break
    case 'BUYER_LOGIN':
      message = `Your SpillNova Buyer login code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
      break
  }

  // TODO: Replace with actual SMS API call
  // Example with Clickatell:
  // const response = await fetch('https://platform.clickatell.com/messages', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.CLICKATELL_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     messages: [{
  //       channel: 'sms',
  //       to: normalizedPhone.replace('+', ''),
  //       content: message,
  //     }],
  //   }),
  // })

  console.log(`[SMS] Would send to ${normalizedPhone}: ${message}`)

  return true
}

/**
 * Clean up expired OTPs (run periodically)
 */
export async function cleanupExpiredOtps(): Promise<number> {
  const result = await prisma.otpCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    },
  })
  return result.count
}
