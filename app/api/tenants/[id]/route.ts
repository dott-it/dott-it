import { NextResponse } from 'next/server'
import { userPrisma } from '@/lib/user-prisma'
import { withBackofficeAccess, AuthorizedRequest } from '@/app/api/middleware/backoffice-access.middleware'
import { ApiError } from '@/app/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/tenants/[id]
 * Retrieve a specific tenant
 */
async function getTenantHandler(_request: AuthorizedRequest, context: RouteParams) {
  try {
    const { id } = await context.params

    const tenant = await userPrisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json<ApiError>(
        {
          error: 'Not found',
          message: 'Tenant not found',
          details: `No tenant found with ID: ${id}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 }
      )
    }

    // Transform the data to match the Tenant type
    const transformedTenant = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domains: tenant.domains,
      logo: tenant.logo,
      userCount: tenant.users.length,
      adminCount: tenant.users.filter(user => user.role === 'admin').length,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      users: tenant.users,
    }

    return NextResponse.json(transformedTenant)
  } catch (error) {
    console.error('API: Error fetching tenant:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while fetching the tenant',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/tenants/[id]
 * Update a tenant
 */
async function updateTenantHandler(request: AuthorizedRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { name, slug, domains, logo } = body

    // Check if tenant exists
    const existingTenant = await userPrisma.tenant.findUnique({
      where: { id },
    })

    if (!existingTenant) {
      return NextResponse.json<ApiError>(
        {
          error: 'Not found',
          message: 'Tenant not found',
          details: `No tenant found with ID: ${id}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 }
      )
    }

    // If slug is being updated, check if new slug already exists
    if (slug && slug !== existingTenant.slug) {
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

      const slugExists = await userPrisma.tenant.findUnique({
        where: { slug },
      })

      if (slugExists) {
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
    }

    // Validate domains array if provided
    if (domains !== undefined && !Array.isArray(domains)) {
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

    // Update the tenant
    const updatedTenant = await userPrisma.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(domains !== undefined && { domains }),
        ...(logo !== undefined && { logo: logo || null }),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    })

    // Transform the response
    const transformedTenant = {
      id: updatedTenant.id,
      name: updatedTenant.name,
      slug: updatedTenant.slug,
      domains: updatedTenant.domains,
      logo: updatedTenant.logo,
      userCount: updatedTenant.users.length,
      adminCount: updatedTenant.users.filter(user => user.role === 'admin').length,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      users: updatedTenant.users,
    }

    return NextResponse.json(transformedTenant)
  } catch (error) {
    console.error('API: Error updating tenant:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while updating the tenant',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

export const GET = withBackofficeAccess(getTenantHandler)
export const PUT = withBackofficeAccess(updateTenantHandler)

