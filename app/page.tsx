import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth.config'
import { workspaceEntryHref } from '@/lib/library/browse/library-workspace-nav'

export default async function HomePage() {
  const session = await auth()

  redirect(workspaceEntryHref(Boolean(session?.user)))
}
