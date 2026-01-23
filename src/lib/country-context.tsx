'use client'

import { createContext, useContext, ReactNode } from 'react'
import { CountryConfig, countries, DEFAULT_COUNTRY } from './countries'

interface CountryContextType {
  country: string
  config: CountryConfig
}

const CountryContext = createContext<CountryContextType | null>(null)

interface CountryProviderProps {
  country: string
  children: ReactNode
}

export function CountryProvider({ country, children }: CountryProviderProps) {
  const config = countries[country] || countries[DEFAULT_COUNTRY]

  return (
    <CountryContext.Provider value={{ country, config }}>
      {children}
    </CountryContext.Provider>
  )
}

export function useCountry(): CountryContextType {
  const context = useContext(CountryContext)
  if (!context) {
    // Return default country if context not available
    return {
      country: DEFAULT_COUNTRY,
      config: countries[DEFAULT_COUNTRY],
    }
  }
  return context
}

// Hook to format price for current country
export function useFormatPrice() {
  const { config } = useCountry()

  return (cents: number): string => {
    const amount = (cents / 100).toFixed(2)
    return config.currencyPosition === 'before'
      ? `${config.currencySymbol}${amount}`
      : `${amount}${config.currencySymbol}`
  }
}
