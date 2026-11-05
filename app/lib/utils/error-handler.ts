import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

type RouteHandler<Params = unknown> = (
  req: NextRequest,
  context: { params: Params },
) => Promise<NextResponse>

export function withErrorHandling<Params = unknown>(handler: RouteHandler<Params>): RouteHandler<Params> {
  return async (req: NextRequest, context: { params: Params }) => {
    try {
      return await handler(req, context)
    } catch (error) {
      console.error('API Route Error:', error)

      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 },
        )
      }

      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json(
        { error: 'An internal server error occurred' },
        { status: 500 },
      )
    }
  }
}
