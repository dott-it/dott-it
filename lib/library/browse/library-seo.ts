import type { Metadata } from 'next'
import { getLibrarySiteUrl } from '@/lib/library/site-url'

const LIBRARY_SITE_NAME = 'Eddo · OpenSciEd Assessment Library'
const LIBRARY_OG_IMAGE_PATH = '/eddo-logo.png'

export function libraryOgImageUrl(): string {
  return `${getLibrarySiteUrl()}${LIBRARY_OG_IMAGE_PATH}`
}

export function libraryPageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  const url = `${getLibrarySiteUrl()}${path}`
  const imageUrl = libraryOgImageUrl()

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: LIBRARY_SITE_NAME,
      type: 'article',
      images: [
        {
          url: imageUrl,
          alt: LIBRARY_SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}
