import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core SA brand - Green (primary actions, CTAs)
        primary: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#007749', // SA Green - main brand color
          600: '#006340',
          700: '#005535',
          800: '#00442A',
          900: '#003620',
        },

        // SA flag accent colors
        accent: {
          gold: '#FFB81C',   // SA Gold - highlights, warnings
          red: '#DE3831',    // SA Red - danger, urgent
          blue: '#002395',   // SA Blue - links, info
          black: '#000000',
          orange: '#F35B1F', // From brand images
        },

        // Ink - text and dark UI elements (navy/charcoal tones)
        ink: {
          50: '#F7F8FA',
          100: '#EEF1F5',
          200: '#D7DDE6',
          300: '#B3BECE',
          400: '#7E8AA0',
          500: '#56627A',
          600: '#3D475C',
          700: '#2A3141',
          800: '#1A1F29',  // Header/nav background
          900: '#0F131A',
        },

        // Surface - backgrounds, cards, containers
        surface: {
          50: '#FFFFFF',
          100: '#F9FAFB',
          200: '#F3F4F6',
          300: '#E5E7EB',
          400: '#D1D5DB',
          500: '#9CA3AF',
          600: '#6B7280',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },

        // Brand warm tones (from images)
        warm: {
          cream: '#EBD4AA',
          paper: '#EEE3D0',
          rust: '#9E5A1C',
          brown: '#5A1F10',
          ochre: '#CFA460',
        },

        // Investigative/dramatic tones (from banners)
        drama: {
          charcoal: '#1E1E19',
          olive: '#616759',
          forest: '#285738',
          sage: '#6C8869',
        },

        // Status colors for UI feedback
        status: {
          success: '#16A34A',
          warning: '#FFB81C',
          danger: '#DE3831',
          info: '#002395',
        },
      },

      // Brand-specific box shadows
      boxShadow: {
        'brand': '0 4px 14px 0 rgba(0, 119, 73, 0.15)',
        'brand-lg': '0 10px 25px -3px rgba(0, 119, 73, 0.2)',
        'gold': '0 4px 14px 0 rgba(255, 184, 28, 0.25)',
      },

      // Animation for brand elements
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },

      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 119, 73, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 119, 73, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
