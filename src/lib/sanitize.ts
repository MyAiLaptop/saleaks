import sanitizeHtml from 'sanitize-html'

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [], // No HTML allowed
    allowedAttributes: {},
  }).trim()
}

// Sanitize content with basic formatting allowed
export function sanitizeContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {},
  }).trim()
}

// Sanitize filename to prevent path traversal
export function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  return filename
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\.\./g, '_')
    .substring(0, 255) // Limit length
}

// Validate and sanitize province/city names
export function sanitizeLocation(location: string): string {
  return sanitizeHtml(location, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/[^a-zA-Z\s\-']/g, '')
    .substring(0, 100)
    .trim()
}

// List of South African provinces
export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
] as const

export type Province = (typeof SA_PROVINCES)[number]
