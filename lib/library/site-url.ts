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

  return 'https://eddolearning.com'
}

/** Marketing demo / community onboarding CTA destination. */
export const EDDO_COMMUNITY_DEMO_URL = 'https://eddolearning.com/demo'
