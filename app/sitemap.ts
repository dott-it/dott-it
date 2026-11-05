import type { MetadataRoute } from 'next'
import { listLibrarySitemapEntries } from '@/lib/library/browse/list-library-sitemap-entries'
import { getLibrarySiteUrl } from '@/lib/library/site-url'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getLibrarySiteUrl()

  return listLibrarySitemapEntries().map(({ path, lastModified }) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: path.includes('/assessments/') || path.includes('/opportunities/') ? 0.7 : 0.8,
  }))
}
