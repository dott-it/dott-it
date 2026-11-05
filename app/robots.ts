import type { MetadataRoute } from 'next'
import { getLibrarySiteUrl } from '@/lib/library/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/library', '/library/'],
    },
    sitemap: `${getLibrarySiteUrl()}/sitemap.xml`,
  }
}
