import CryptoJS from 'crypto-js'
import { nanoid } from 'nanoid'

// Generate a secure random token for whistleblower contact
export function generateContactToken(): string {
  return nanoid(32)
}

// Generate a public ID for posts (shorter, URL-friendly)
export function generatePublicId(): string {
  return nanoid(12)
}

// Encrypt a message using the contact token as key
export function encryptMessage(message: string, contactToken: string): string {
  const secretKey = contactToken + process.env.ENCRYPTION_SECRET
  return CryptoJS.AES.encrypt(message, secretKey).toString()
}

// Decrypt a message using the contact token
export function decryptMessage(encryptedMessage: string, contactToken: string): string | null {
  try {
    const secretKey = contactToken + process.env.ENCRYPTION_SECRET
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, secretKey)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted || null
  } catch {
    return null
  }
}

// Hash admin password for comparison
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString()
}

// Verify admin password
export function verifyAdminPassword(password: string): boolean {
  // In production, store the hash, not plaintext
  return password === process.env.ADMIN_PASSWORD
}

// Hash email for privacy-preserving storage (one-way)
export function hashEmail(email: string): string {
  return CryptoJS.SHA256(email.toLowerCase().trim()).toString()
}

// Encrypt email for storage (reversible, for sending emails)
export function encryptEmail(email: string): string {
  const secretKey = process.env.ENCRYPTION_SECRET || 'dev-secret'
  return CryptoJS.AES.encrypt(email.toLowerCase().trim(), secretKey).toString()
}

// Decrypt email for sending
export function decryptEmail(encryptedEmail: string): string | null {
  try {
    const secretKey = process.env.ENCRYPTION_SECRET || 'dev-secret'
    const bytes = CryptoJS.AES.decrypt(encryptedEmail, secretKey)
    return bytes.toString(CryptoJS.enc.Utf8) || null
  } catch {
    return null
  }
}

// Generate secure verification token
export function generateVerifyToken(): string {
  return nanoid(48)
}

// Generate unsubscribe token
export function generateUnsubscribeToken(): string {
  return nanoid(32)
}
