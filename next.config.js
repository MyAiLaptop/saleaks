/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Security headers for whistleblower protection
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Strict CSP - no external scripts or tracking
          // Allow R2 storage URLs for media content
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.r2.dev https://media.saleaks.co.za; media-src 'self' blob: https://*.r2.cloudflarestorage.com https://*.r2.dev https://media.saleaks.co.za; font-src 'self'; connect-src 'self' https://*.r2.cloudflarestorage.com https://media.saleaks.co.za; frame-ancestors 'none';"
          },
          // Referrer policy - don't leak referrer info
          { key: 'Referrer-Policy', value: 'no-referrer' },
          // Permissions policy - allow camera/mic for video recording, disable tracking
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()'
          },
          // HSTS
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // Prevent DNS prefetching (privacy)
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          // Don't cache sensitive pages
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          // Cross-Origin policies - relaxed to allow R2 media loading
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          // Note: COEP removed to allow loading images from R2 without CORS headers
        ],
      },
    ];
  },
  // Disable x-powered-by header
  poweredByHeader: false,
  // Disable image optimization to avoid external calls
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
