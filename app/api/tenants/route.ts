import { NextResponse } from 'next/server'
import { userPrisma } from '@/lib/user-prisma'
import { withBackofficeAccess, AuthorizedRequest } from '@/app/api/middleware/backoffice-access.middleware'
import { ApiError } from '@/app/types'

/**
 * GET /api/tenants
 * Retrieve all tenants in the system
 */
async function getTenantsHandler(_request: AuthorizedRequest) {
  try {

    const tenants = await userPrisma.tenant.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Transform the data to include user count and other useful information
    const transformedTenants = tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domains: tenant.domains,
      logo: tenant.logo,
      userCount: tenant.users.length,
      adminCount: tenant.users.filter(user => user.role === 'admin').length,
      status: 'active', // All tenants are considered active for now
      createdAt: new Date().toISOString(), // We don't have createdAt in the schema yet
    }))

    return NextResponse.json(transformedTenants)
  } catch (error) {
    console.error('API: Error fetching tenants:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while fetching tenants',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tenants
 * Create a new tenant
 */
async function createTenantHandler(request: AuthorizedRequest) {
  try {
    const body = await request.json()
    const { name, slug, domains, logo } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Missing required fields',
          details: 'Name and slug are required fields',
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Validate slug format (should be lowercase, alphanumeric with dots and hyphens)
    const slugRegex = /^[a-z0-9.-]+$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Invalid slug format',
          details: 'Slug must be lowercase and contain only letters, numbers, dots, and hyphens',
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Validate domains array
    if (domains && !Array.isArray(domains)) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Invalid domains format',
          details: 'Domains must be an array of strings',
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Check if tenant with this slug already exists
    const existingTenant = await userPrisma.tenant.findUnique({
      where: { slug },
    })

    if (existingTenant) {
      return NextResponse.json<ApiError>(
        {
          error: 'Conflict',
          message: 'Tenant with this slug already exists',
          details: `A tenant with slug "${slug}" already exists. Please choose a different slug.`,
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 409 }
      )
    }

    // Create the tenant
    const tenant = await userPrisma.tenant.create({
      data: {
        name,
        slug,
        domains: domains || [],
        logo: logo || null,
      },
    })

    // Transform the response to match the Tenant type
    const transformedTenant = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domains: tenant.domains,
      logo: tenant.logo,
      userCount: 0,
      adminCount: 0,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(transformedTenant, { status: 201 })
  } catch (error) {
    console.error('API: Error creating tenant:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while creating the tenant',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

export const GET = withBackofficeAccess(getTenantsHandler)
export const POST = withBackofficeAccess(createTenantHandler)
