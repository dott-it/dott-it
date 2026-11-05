import { userPrisma } from '@/lib/user-prisma'

const ALLOWED_BACKOFFICE_TENANT_NAMES = new Set([
  'dott.it',
  'dott.it demo school',
  'development environment',
])
const ALLOWED_BACKOFFICE_TENANT_SLUGS = new Set(['dott-demo', 'dott-it', 'development'])

/**
 * Whether this tenant is a Dott.it/backoffice tenant that may access
 * workspace resources across other tenants (same gate as backoffice UI).
 */
export async function isBackofficeTenant(
  tenantId: string | null | undefined,
): Promise<boolean> {
  if (!tenantId) return false

  try {
    const tenant = await userPrisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, slug: true },
    })
    if (!tenant) return false

    const name = tenant.name.toLowerCase().trim()
    const slug = tenant.slug.toLowerCase().trim()
    return (
      ALLOWED_BACKOFFICE_TENANT_NAMES.has(name) ||
      ALLOWED_BACKOFFICE_TENANT_SLUGS.has(slug)
    )
  } catch {
    return false
  }
}
