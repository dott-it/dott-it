import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/assessmentDB'
import { CreateEventParams, EventsResponse } from '@/app/types'
import { auth } from '@/lib/auth.config'

export async function GET(request: NextRequest): Promise<NextResponse<EventsResponse>> {
    try {
        const { searchParams } = new URL(request.url)
        const name = searchParams.get('name')

        console.log('API: Starting events fetch...')
        console.log('API: Filter by name:', name || 'none')

        // Using the global Prisma client singleton. Do not call $connect()/$disconnect() per-request
        // to avoid racing the native query engine when handling concurrent requests.

        // Build query based on filters
        const whereClause = name ? { name: { contains: name, mode: 'insensitive' as const } } : {}

        let events
        try {
            events = await prisma.event.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' }
            })
            console.log(`API: Successfully fetched ${events.length} events`)
        } catch (queryError) {
            console.error('API: Error fetching events:', queryError)
            return NextResponse.json({
                error: 'Failed to fetch events',
                message: 'Unable to retrieve event data. Please try again.',
                details: queryError instanceof Error ? queryError.message : 'Unknown query error',
                type: 'QUERY_ERROR',
                retryable: true
            }, { status: 500 })
        }

        const formattedEvents = events.map((event) => ({
            id: event.id,
            name: event.name,
            // Prisma JSON fields are typed as Prisma.JsonValue. We narrow to object-or-null for API type.
            payload:
                event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload)
                    ? (event.payload as Record<string, unknown>)
                    : null,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString()
        }))

        return NextResponse.json(formattedEvents)
    } catch (error) {
        console.error('API: Unexpected error in events fetch:', error)
        return NextResponse.json({
            error: 'Unexpected error occurred',
            message: 'An unexpected error occurred while processing your request.',
            details: error instanceof Error ? error.message : 'Unknown error',
            type: 'UNEXPECTED_ERROR',
            retryable: true
        }, { status: 500 })
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        console.log('API: Starting event creation...')
        const sesssion = await auth()

        // Require authentication
        if (!sesssion) {
            return NextResponse.json({
                error: 'UNAUTHORIZED',
                message: 'Authentication required.'
            }, { status: 401 })
        }

        // Using the global Prisma client singleton. Do not call $connect()/$disconnect() per-request
        // to avoid racing the native query engine when handling concurrent requests.

        let body: CreateEventParams
        try {
            body = await request.json()
        } catch (parseError) {
            console.error('API: Error parsing request body:', parseError)
            return NextResponse.json({
                error: 'Invalid request body',
                message: 'Unable to parse request body. Please check your JSON format.',
                details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
                type: 'PARSE_ERROR',
                retryable: false
            }, { status: 400 })
        }

        // Validate required fields
        if (!body.name || typeof body.name !== 'string') {
            return NextResponse.json({
                error: 'Validation error',
                message: 'Event name is required and must be a string.',
                type: 'VALIDATION_ERROR',
                retryable: false
            }, { status: 400 })
        }

        let event
        try {
            event = await prisma.event.create({
                data: {
                    name: body.name,
                    userEmail: sesssion?.user.email||'',
                    ...(body.payload !== undefined && {
                        payload: body.payload as Prisma.InputJsonValue
                    })
                }
            })
            console.log(`API: Successfully created event with ID: ${event.id}`)
        } catch (createError) {
            console.error('API: Error creating event:', createError)
            return NextResponse.json({
                error: 'Failed to create event',
                message: 'Unable to create event. Please try again.',
                details: createError instanceof Error ? createError.message : 'Unknown create error',
                type: 'CREATE_ERROR',
                retryable: true
            }, { status: 500 })
        }

        const formattedEvent = {
            id: event.id,
            name: event.name,
            payload:
                event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload)
                    ? (event.payload as Record<string, unknown>)
                    : null,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString()
        }

        return NextResponse.json(formattedEvent, { status: 201 })
    } catch (error) {
        console.error('API: Unexpected error in event creation:', error)
        return NextResponse.json({
            error: 'Unexpected error occurred',
            message: 'An unexpected error occurred while processing your request.',
            details: error instanceof Error ? error.message : 'Unknown error',
            type: 'UNEXPECTED_ERROR',
            retryable: true
        }, { status: 500 })
    }
}
