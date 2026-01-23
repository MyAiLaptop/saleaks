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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
  },
  // Africa
  zw: {
    code: 'ZW',
    name: 'Zimbabwe',
    flag: '🇿🇼',
    currency: 'USD',
    currencySymbol: '$',
    currencyPosition: 'before',
    phonePrefix: '+263',
    phoneLength: 9,
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
      'Harare',
      'Bulawayo',
      'Manicaland',
      'Mashonaland',
      'Matabeleland',
      'Midlands',
      'Masvingo',
      'Other',
    ],
    timezone: 'Africa/Harare',
    enabled: true,
  },
  eg: {
    code: 'EG',
    name: 'Egypt',
    flag: '🇪🇬',
    currency: 'EGP',
    currencySymbol: 'E£',
    currencyPosition: 'before',
    phonePrefix: '+20',
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
      'Cairo',
      'Alexandria',
      'Giza',
      'Luxor',
      'Aswan',
      'Other',
    ],
    timezone: 'Africa/Cairo',
    enabled: true,
  },
  ma: {
    code: 'MA',
    name: 'Morocco',
    flag: '🇲🇦',
    currency: 'MAD',
    currencySymbol: 'MAD',
    currencyPosition: 'after',
    phonePrefix: '+212',
    phoneLength: 9,
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
      'Casablanca',
      'Rabat',
      'Marrakech',
      'Fes',
      'Tangier',
      'Other',
    ],
    timezone: 'Africa/Casablanca',
    enabled: true,
  },
  tz: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh',
    currencyPosition: 'before',
    phonePrefix: '+255',
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
      'Dar es Salaam',
      'Dodoma',
      'Arusha',
      'Mwanza',
      'Zanzibar',
      'Other',
    ],
    timezone: 'Africa/Dar_es_Salaam',
    enabled: true,
  },
  ug: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    currencyPosition: 'before',
    phonePrefix: '+256',
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
      'Kampala',
      'Entebbe',
      'Jinja',
      'Gulu',
      'Mbarara',
      'Other',
    ],
    timezone: 'Africa/Kampala',
    enabled: true,
  },
  et: {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'Br',
    currencyPosition: 'before',
    phonePrefix: '+251',
    phoneLength: 9,
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
      'Addis Ababa',
      'Dire Dawa',
      'Oromia',
      'Amhara',
      'Tigray',
      'Other',
    ],
    timezone: 'Africa/Addis_Ababa',
    enabled: true,
  },
  // Europe
  de: {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    currencySymbol: '€',
    currencyPosition: 'after',
    phonePrefix: '+49',
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
      'Berlin',
      'Bavaria',
      'Hamburg',
      'North Rhine-Westphalia',
      'Baden-Württemberg',
      'Other',
    ],
    timezone: 'Europe/Berlin',
    enabled: true,
  },
  fr: {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    currencySymbol: '€',
    currencyPosition: 'after',
    phonePrefix: '+33',
    phoneLength: 9,
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
      'Île-de-France',
      'Provence-Alpes-Côte d\'Azur',
      'Auvergne-Rhône-Alpes',
      'Nouvelle-Aquitaine',
      'Occitanie',
      'Other',
    ],
    timezone: 'Europe/Paris',
    enabled: true,
  },
  es: {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    currency: 'EUR',
    currencySymbol: '€',
    currencyPosition: 'after',
    phonePrefix: '+34',
    phoneLength: 9,
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
      'Madrid',
      'Catalonia',
      'Andalusia',
      'Valencia',
      'Basque Country',
      'Other',
    ],
    timezone: 'Europe/Madrid',
    enabled: true,
  },
  it: {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    currency: 'EUR',
    currencySymbol: '€',
    currencyPosition: 'after',
    phonePrefix: '+39',
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
      'Lombardy',
      'Lazio',
      'Campania',
      'Sicily',
      'Veneto',
      'Other',
    ],
    timezone: 'Europe/Rome',
    enabled: true,
  },
  nl: {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    currency: 'EUR',
    currencySymbol: '€',
    currencyPosition: 'after',
    phonePrefix: '+31',
    phoneLength: 9,
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
      'North Holland',
      'South Holland',
      'Utrecht',
      'North Brabant',
      'Gelderland',
      'Other',
    ],
    timezone: 'Europe/Amsterdam',
    enabled: true,
  },
  ie: {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    currency: 'EUR',
    currencySymbol: '€',
    currencyPosition: 'after',
    phonePrefix: '+353',
    phoneLength: 9,
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
      'Dublin',
      'Cork',
      'Galway',
      'Limerick',
      'Waterford',
      'Other',
    ],
    timezone: 'Europe/Dublin',
    enabled: true,
  },
  // Asia
  ind: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    currencyPosition: 'before',
    phonePrefix: '+91',
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
      'Maharashtra',
      'Delhi',
      'Karnataka',
      'Tamil Nadu',
      'West Bengal',
      'Other',
    ],
    timezone: 'Asia/Kolkata',
    enabled: true,
  },
  pk: {
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    currency: 'PKR',
    currencySymbol: '₨',
    currencyPosition: 'before',
    phonePrefix: '+92',
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
      'Punjab',
      'Sindh',
      'Khyber Pakhtunkhwa',
      'Balochistan',
      'Islamabad',
      'Other',
    ],
    timezone: 'Asia/Karachi',
    enabled: true,
  },
  ph: {
    code: 'PH',
    name: 'Philippines',
    flag: '🇵🇭',
    currency: 'PHP',
    currencySymbol: '₱',
    currencyPosition: 'before',
    phonePrefix: '+63',
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
      'Metro Manila',
      'Cebu',
      'Davao',
      'Calabarzon',
      'Central Luzon',
      'Other',
    ],
    timezone: 'Asia/Manila',
    enabled: true,
  },
  idn: {
    code: 'ID',
    name: 'Indonesia',
    flag: '🇮🇩',
    currency: 'IDR',
    currencySymbol: 'Rp',
    currencyPosition: 'before',
    phonePrefix: '+62',
    phoneLength: 11,
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
      'Jakarta',
      'West Java',
      'East Java',
      'Central Java',
      'Bali',
      'Other',
    ],
    timezone: 'Asia/Jakarta',
    enabled: true,
  },
  my: {
    code: 'MY',
    name: 'Malaysia',
    flag: '🇲🇾',
    currency: 'MYR',
    currencySymbol: 'RM',
    currencyPosition: 'before',
    phonePrefix: '+60',
    phoneLength: 9,
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
      'Kuala Lumpur',
      'Selangor',
      'Penang',
      'Johor',
      'Sabah',
      'Sarawak',
      'Other',
    ],
    timezone: 'Asia/Kuala_Lumpur',
    enabled: true,
  },
  sg: {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD',
    currencySymbol: 'S$',
    currencyPosition: 'before',
    phonePrefix: '+65',
    phoneLength: 8,
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
    provinces: [],
    timezone: 'Asia/Singapore',
    enabled: true,
  },
  // Americas
  ca: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: 'C$',
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
    provinces: [
      'Ontario',
      'Quebec',
      'British Columbia',
      'Alberta',
      'Manitoba',
      'Other',
    ],
    timezone: 'America/Toronto',
    enabled: true,
  },
  mx: {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    currencySymbol: 'MX$',
    currencyPosition: 'before',
    phonePrefix: '+52',
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
      'Mexico City',
      'Jalisco',
      'Nuevo León',
      'Yucatán',
      'Quintana Roo',
      'Other',
    ],
    timezone: 'America/Mexico_City',
    enabled: true,
  },
  br: {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    currency: 'BRL',
    currencySymbol: 'R$',
    currencyPosition: 'before',
    phonePrefix: '+55',
    phoneLength: 11,
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
      'São Paulo',
      'Rio de Janeiro',
      'Minas Gerais',
      'Bahia',
      'Paraná',
      'Other',
    ],
    timezone: 'America/Sao_Paulo',
    enabled: true,
  },
  ar: {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS',
    currencySymbol: 'AR$',
    currencyPosition: 'before',
    phonePrefix: '+54',
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
      'Buenos Aires',
      'Córdoba',
      'Santa Fe',
      'Mendoza',
      'Tucumán',
      'Other',
    ],
    timezone: 'America/Argentina/Buenos_Aires',
    enabled: true,
  },
  co: {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    currency: 'COP',
    currencySymbol: 'CO$',
    currencyPosition: 'before',
    phonePrefix: '+57',
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
      'Bogotá',
      'Antioquia',
      'Valle del Cauca',
      'Atlántico',
      'Santander',
      'Other',
    ],
    timezone: 'America/Bogota',
    enabled: true,
  },
  // Oceania
  au: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    currencySymbol: 'A$',
    currencyPosition: 'before',
    phonePrefix: '+61',
    phoneLength: 9,
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
      'New South Wales',
      'Victoria',
      'Queensland',
      'Western Australia',
      'South Australia',
      'Tasmania',
      'Other',
    ],
    timezone: 'Australia/Sydney',
    enabled: true,
  },
  nz: {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    currency: 'NZD',
    currencySymbol: 'NZ$',
    currencyPosition: 'before',
    phonePrefix: '+64',
    phoneLength: 9,
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
      'Auckland',
      'Wellington',
      'Canterbury',
      'Waikato',
      'Otago',
      'Other',
    ],
    timezone: 'Pacific/Auckland',
    enabled: true,
  },
  // Middle East
  ae: {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    currencySymbol: 'AED',
    currencyPosition: 'before',
    phonePrefix: '+971',
    phoneLength: 9,
    paymentMethods: ['stripe'],
    categories: [
      'BREAKING',
      'CRIME',
      'POLITICS',
      'COMMUNITY',
      'OTHER',
    ],
    provinces: [
      'Dubai',
      'Abu Dhabi',
      'Sharjah',
      'Ajman',
      'Other',
    ],
    timezone: 'Asia/Dubai',
    enabled: true,
  },
  ksa: {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    currencySymbol: 'SAR',
    currencyPosition: 'before',
    phonePrefix: '+966',
    phoneLength: 9,
    paymentMethods: ['stripe'],
    categories: [
      'BREAKING',
      'COMMUNITY',
      'OTHER',
    ],
    provinces: [
      'Riyadh',
      'Makkah',
      'Eastern Province',
      'Madinah',
      'Other',
    ],
    timezone: 'Asia/Riyadh',
    enabled: true,
  },
  il: {
    code: 'IL',
    name: 'Israel',
    flag: '🇮🇱',
    currency: 'ILS',
    currencySymbol: '₪',
    currencyPosition: 'before',
    phonePrefix: '+972',
    phoneLength: 9,
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
      'Tel Aviv',
      'Jerusalem',
      'Haifa',
      'Central District',
      'Other',
    ],
    timezone: 'Asia/Jerusalem',
    enabled: true,
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
