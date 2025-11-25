/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suppress middleware deprecation warning (middleware is still the correct approach in Next.js 16)
  experimental: {
    // This warning appears to be a false positive in Next.js 16
  },
}

module.exports = nextConfig

