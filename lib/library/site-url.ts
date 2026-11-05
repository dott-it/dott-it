/**
 * Canonical origin for library SEO (sitemap, Open Graph, canonical URLs).
 */
export function getLibrarySiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (fromEnv) {
    return fromEnv
  }

  const vercel = process.env.VERCEL_URL
  if (vercel) {
    return `https://${vercel.replace(/\/$/, '')}`
  }

  return 'https://dott-it.vercel.app'
}

/** Marketing demo / community onboarding CTA destination. */
export const DOTT_COMMUNITY_DEMO_URL = 'https://dott-it.vercel.app'
