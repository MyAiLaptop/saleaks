'use client'

import * as Flags from 'country-flag-icons/react/3x2'

interface FlagProps {
  countryCode: string // ISO 3166-1 alpha-2 code (e.g., 'ZA', 'NG', 'US')
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Map lowercase country keys to uppercase ISO codes
const countryCodeMap: Record<string, string> = {
  sa: 'ZA', // South Africa
  ng: 'NG', // Nigeria
  ke: 'KE', // Kenya
  gh: 'GH', // Ghana
  us: 'US', // United States
  gb: 'GB', // United Kingdom
  zw: 'ZW', // Zimbabwe
  eg: 'EG', // Egypt
  ma: 'MA', // Morocco
  tz: 'TZ', // Tanzania
  ug: 'UG', // Uganda
  et: 'ET', // Ethiopia
  de: 'DE', // Germany
  fr: 'FR', // France
  es: 'ES', // Spain
  it: 'IT', // Italy
  nl: 'NL', // Netherlands
  ie: 'IE', // Ireland
  pt: 'PT', // Portugal
  be: 'BE', // Belgium
  at: 'AT', // Austria
  ch: 'CH', // Switzerland
  se: 'SE', // Sweden
  no: 'NO', // Norway
  dk: 'DK', // Denmark
  fi: 'FI', // Finland
  pl: 'PL', // Poland
  cz: 'CZ', // Czech Republic
  gr: 'GR', // Greece
  ro: 'RO', // Romania
  hu: 'HU', // Hungary
  ua: 'UA', // Ukraine
  ru: 'RU', // Russia
  tr: 'TR', // Turkey
  in: 'IN', // India
  pk: 'PK', // Pakistan
  bd: 'BD', // Bangladesh
  id: 'ID', // Indonesia
  ph: 'PH', // Philippines
  vn: 'VN', // Vietnam
  th: 'TH', // Thailand
  my: 'MY', // Malaysia
  sg: 'SG', // Singapore
  jp: 'JP', // Japan
  kr: 'KR', // South Korea
  cn: 'CN', // China
  tw: 'TW', // Taiwan
  hk: 'HK', // Hong Kong
  au: 'AU', // Australia
  nz: 'NZ', // New Zealand
  ca: 'CA', // Canada
  mx: 'MX', // Mexico
  br: 'BR', // Brazil
  ar: 'AR', // Argentina
  cl: 'CL', // Chile
  co: 'CO', // Colombia
  pe: 'PE', // Peru
  ve: 'VE', // Venezuela
  ae: 'AE', // UAE
  sa_ar: 'SA', // Saudi Arabia (using sa_ar to avoid conflict with South Africa)
  il: 'IL', // Israel
  // Add more as needed
}

const sizeClasses = {
  sm: 'w-5 h-4',
  md: 'w-8 h-6',
  lg: 'w-12 h-8',
  xl: 'w-16 h-12',
}

export function Flag({ countryCode, className = '', size = 'md' }: FlagProps) {
  // Convert to uppercase ISO code
  const isoCode = countryCodeMap[countryCode.toLowerCase()] || countryCode.toUpperCase()

  // Get the flag component
  const FlagComponent = Flags[isoCode as keyof typeof Flags]

  if (!FlagComponent) {
    // Fallback to country code text if flag not found
    return (
      <span className={`inline-flex items-center justify-center bg-gray-700 text-white text-xs font-bold rounded ${sizeClasses[size]} ${className}`}>
        {isoCode}
      </span>
    )
  }

  return (
    <FlagComponent
      className={`inline-block rounded shadow-sm ${sizeClasses[size]} ${className}`}
      title={isoCode}
    />
  )
}
