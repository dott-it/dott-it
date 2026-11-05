/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel specific, see https://pris.ly/d/engine-not-found-nextjs
  outputFileTracingIncludes: {
    '**/*': [
      './node_modules/@prisma/assessmentDB/libquery_engine-*',
      './node_modules/@prisma/user-client/libquery_engine-*',
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false, // Re-enabled after fixing critical type errors
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    '@prisma/client',
    'playwright',
    'playwright-core',
    '@playwright/test',
  ],
  experimental: {
    testProxy: true,
  },
}

export default nextConfig