// Client-side encryption - runs in browser, server never sees plaintext

/**
 * Generate a cryptographically secure random key
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Derive an encryption key from a password/token using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a message client-side using AES-GCM
 * The server never sees the plaintext
 */
export async function encryptClientSide(
  plaintext: string,
  token: string
): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Derive key from token
  const key = await deriveKey(token, salt)

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  // Combine salt + iv + ciphertext and encode as base64
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)

  return btoa(String.fromCharCode.apply(null, Array.from(combined)))
}

/**
 * Decrypt a message client-side
 */
export async function decryptClientSide(
  encryptedBase64: string,
  token: string
): Promise<string | null> {
  try {
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0))

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const ciphertext = combined.slice(28)

    // Derive key from token
    const key = await deriveKey(token, salt)

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch {
    return null
  }
}

/**
 * Hash data using SHA-256 (for verification without exposing original)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
