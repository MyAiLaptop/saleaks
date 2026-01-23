/**
 * Multi-Country Configuration
 *
 * Each country has its own:
 * - Currency and pricing
 * - Phone validation
 * - Payment methods
 * - Categories
 * - Localized content
 */

export interface CountryConfig {
  code: string // ISO 3166-1 alpha-2
  name: string
  flag: string // emoji
  currency: string
  currencySymbol: string
  currencyPosition: 'before' | 'after'
  phonePrefix: string
  phoneLength: number // digits after country code
  paymentMethods: ('carrier' | 'payfast' | 'paystack' | 'stripe' | 'mpesa' | 'flutterwave')[]
  categories: string[]
  provinces?: string[] // states/provinces/regions
  timezone: string
  enabled: boolean
}

export const countries: Record<string, CountryConfig> = {
  sa: {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    currencySymbol: 'R',
    currencyPosition: 'before',
    phonePrefix: '+27',
    phoneLength: 9,
    paymentMethods: ['carrier', 'payfast'],
    categories: [
      'BREAKING',
      'TRAFFIC',
      'CRIME',
      'PROTEST',
      'LOADSHEDDING',
      'WEATHER',
      'COMMUNITY',
      'POLITICS',
      'OTHER',
    ],
    provinces: [
      'Gauteng',
      'Western Cape',
      'KwaZulu-Natal',
      'Eastern Cape',
      'Free State',
      'Limpopo',
      'Mpumalanga',
      'North West',
      'Northern Cape',
    ],
    timezone: 'Africa/Johannesburg',
    enabled: true,
  },
  ng: {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    currencySymbol: '₦',
    currencyPosition: 'before',
    phonePrefix: '+234',
    phoneLength: 10,
    paymentMethods: ['paystack', 'flutterwave'],
    categories: [
      'BREAKING',
      'CRIME',
      'POLITICS',
      'FUEL_SCARCITY',
      'PROTEST',
      'WEATHER',
      'COMMUNITY',
      'OTHER',
    ],
    provinces: [
      'Lagos',
      'Abuja',
      'Rivers',
      'Kano',
      'Oyo',
      'Kaduna',
      'Delta',
      'Anambra',
      'Other',
    ],
    timezone: 'Africa/Lagos',
    enabled: false, // Enable when ready
  },
  ke: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    currencyPosition: 'before',
    phonePrefix: '+254',
    phoneLength: 9,
    paymentMethods: ['mpesa', 'stripe'],
    categories: [
      'BREAKING',
      'CRIME',
      'POLITICS',
      'PROTEST',
      'WEATHER',
      'COMMUNITY',
      'OTHER',
    ],
    provinces: [
      'Nairobi',
      'Mombasa',
      'Kisumu',
      'Nakuru',
      'Eldoret',
      'Other',
    ],
    timezone: 'Africa/Nairobi',
    enabled: false,
  },
  gh: {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS',
    currencySymbol: 'GH₵',
    currencyPosition: 'before',
    phonePrefix: '+233',
    phoneLength: 9,
    paymentMethods: ['flutterwave', 'stripe'],
    categories: [
      'BREAKING',
      'CRIME',
      'POLITICS',
      'PROTEST',
      'COMMUNITY',
      'OTHER',
    ],
    provinces: [
      'Greater Accra',
      'Ashanti',
      'Central',
      'Western',
      'Eastern',
      'Other',
    ],
    timezone: 'Africa/Accra',
    enabled: false,
  },
  us: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    currencyPosition: 'before',
    phonePrefix: '+1',
    phoneLength: 10,
    paymentMethods: ['stripe'],
    categories: [
      'BREAKING',
      'CRIME',
      'POLITICS',
      'PROTEST',
      'WEATHER',
      'COMMUNITY',
      'OTHER',
    ],
    provinces: [], // Too many states to list
    timezone: 'America/New_York',
    enabled: false,
  },
  uk: {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    currencyPosition: 'before',
    phonePrefix: '+44',
    phoneLength: 10,
    paymentMethods: ['stripe'],
    categories: [
      'BREAKING',
      'CRIME',
      'POLITICS',
      'PROTEST',
      'WEATHER',
      'COMMUNITY',
      'OTHER',
    ],
    provinces: [
      'England',
      'Scotland',
      'Wales',
      'Northern Ireland',
    ],
    timezone: 'Europe/London',
    enabled: false,
  },
}

// Get enabled countries only
export function getEnabledCountries(): Record<string, CountryConfig> {
  return Object.fromEntries(
    Object.entries(countries).filter(([, config]) => config.enabled)
  )
}

// Get all country codes
export function getCountryCodes(): string[] {
  return Object.keys(countries)
}

// Get enabled country codes
export function getEnabledCountryCodes(): string[] {
  return Object.keys(getEnabledCountries())
}

// Check if a country code is valid
export function isValidCountry(code: string): boolean {
  return code in countries
}

// Check if a country is enabled
export function isCountryEnabled(code: string): boolean {
  return countries[code]?.enabled ?? false
}

// Get country config by code
export function getCountryConfig(code: string): CountryConfig | null {
  return countries[code] || null
}

// Format price for a country
export function formatPrice(cents: number, countryCode: string): string {
  const config = countries[countryCode]
  if (!config) return `${cents / 100}`

  const amount = (cents / 100).toFixed(2)
  return config.currencyPosition === 'before'
    ? `${config.currencySymbol}${amount}`
    : `${amount}${config.currencySymbol}`
}

// Validate phone number for a country
export function isValidPhoneForCountry(phone: string, countryCode: string): boolean {
  const config = countries[countryCode]
  if (!config) return false

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')

  // Check if starts with country code (without +)
  const prefix = config.phonePrefix.replace('+', '')

  if (digits.startsWith(prefix)) {
    // International format: +27821234567
    return digits.length === prefix.length + config.phoneLength
  } else if (digits.startsWith('0')) {
    // Local format: 0821234567
    return digits.length === config.phoneLength + 1
  } else {
    // Just the number: 821234567
    return digits.length === config.phoneLength
  }
}

// Format phone to international format
export function formatPhoneForCountry(phone: string, countryCode: string): string {
  const config = countries[countryCode]
  if (!config) return phone

  // Remove all non-digits
  let digits = phone.replace(/\D/g, '')

  // Remove leading zero
  if (digits.startsWith('0')) {
    digits = digits.substring(1)
  }

  // Remove country code if present
  const prefix = config.phonePrefix.replace('+', '')
  if (digits.startsWith(prefix)) {
    digits = digits.substring(prefix.length)
  }

  return `${config.phonePrefix}${digits}`
}

// Default country (for redirects)
export const DEFAULT_COUNTRY = 'sa'
