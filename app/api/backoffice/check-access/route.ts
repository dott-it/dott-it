import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth.config'
import { userPrisma } from '@/lib/user-prisma'

/**
 * GET /api/backoffice/check-access
 * Check if the current user can access the backoffice
 * Access is granted ONLY if user belongs to "Development Environment" or "Dott.it" tenant
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ canAccess: false })
    }

    const tenant = await userPrisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true, slug: true },
    })

    if (!tenant) {
      return NextResponse.json({ canAccess: false })
    }

    // Normalize tenant name and slug for comparison (trim and lowercase)
    const tenantName = tenant.name.toLowerCase().trim()
    const tenantSlug = tenant.slug.toLowerCase().trim()
    
    // STRICT list of allowed tenant names (case-insensitive)
    const allowedTenants = [
      'development environment',
      'dott.it',
      'dott.it demo school',
    ]
    
    // STRICT list of allowed slugs (case-insensitive)
    const allowedSlugs = [
      'development',
      'dott-it',
      'dott-demo',
    ]

    // Check if tenant matches EXACTLY (after normalization)
    const canAccessByName = allowedTenants.includes(tenantName)
    const canAccessBySlug = allowedSlugs.includes(tenantSlug)
    const canAccess = canAccessByName || canAccessBySlug

    return NextResponse.json({ canAccess })
  } catch {
    return NextResponse.json({ canAccess: false })
  }
}

