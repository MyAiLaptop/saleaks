import { notFound } from 'next/navigation'
import { CountryProvider } from '@/lib/country-context'
import { isValidCountry, isCountryEnabled, countries } from '@/lib/countries'

interface CountryLayoutProps {
  children: React.ReactNode
  params: Promise<{ country: string }>
}

export async function generateStaticParams() {
  // Pre-generate pages for all countries
  return Object.keys(countries).map((country) => ({
    country,
  }))
}

export default async function CountryLayout({
  children,
  params,
}: CountryLayoutProps) {
  const { country } = await params

  // Validate country code
  if (!isValidCountry(country)) {
    notFound()
  }

  // Check if country is enabled (optional - you might want to show "coming soon" instead)
  if (!isCountryEnabled(country)) {
    // For now, we'll still render but could redirect or show coming soon
    // notFound()
  }

  return (
    <CountryProvider country={country}>
      {children}
    </CountryProvider>
  )
}
