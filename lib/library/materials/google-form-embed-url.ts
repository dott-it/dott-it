/** Google Forms embed URL (official ?embedded=true param). */
export function googleFormEmbedUrl(viewformUrl: string): string {
  try {
    const url = new URL(viewformUrl)
    url.searchParams.set('embedded', 'true')
    return url.toString()
  } catch {
    const joiner = viewformUrl.includes('?') ? '&' : '?'
    return `${viewformUrl}${joiner}embedded=true`
  }
}
