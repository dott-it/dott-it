/**
 * Build the public facing URL for a form slug.
 * @param {string} slug
 * @returns {string}
 */
export function getFriendlyFormUrl(slug: string, origin = 'https://dott-it.vercel.app') {
  return `${origin}/form/${slug}`
}

/**
 * Build the QR code URL for a form slug.
 * @param {string} slug
 * @returns {string}
 */
export function getQrCodeUrl(slug: string, origin = 'https://dott-it.vercel.app') {
  return `${origin}/form/${slug}`
}
