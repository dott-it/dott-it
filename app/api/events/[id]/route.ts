import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/assessmentDB'
import { EventResponse, UpdateEventParams } from '@/types/api/event.api'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<EventResponse>> {
    try {
        const { id } = await params
        console.log(`API: Starting event fetch for ID: ${id}`)

        // Using the global Prisma client singleton. Do not call $connect()/$disconnect() per-request

        let event
        try {
            event = await prisma.event.findUnique({
                where: { id }
            })
            
            if (!event) {
                return NextResponse.json({
                    error: 'Event not found',
                    message: `Event with ID ${id} was not found.`,
                    details: `No event exists with the provided ID: ${id}`,
                    type: 'NOT_FOUND_ERROR',
                    retryable: false
                }, { status: 404 })
            }

            console.log(`API: Successfully fetched event: ${event.name}`)
        } catch (queryError) {
            console.error('API: Error fetching event:', queryError)
            return NextResponse.json({
                error: 'Failed to fetch event',
                message: 'Unable to retrieve event data. Please try again.',
                details: queryError instanceof Error ? queryError.message : 'Unknown query error',
                type: 'QUERY_ERROR',
                retryable: true
            }, { status: 500 })
        }

        const formattedEvent = {
            id: event.id,
            name: event.name,
            payload: event.payload as Record<string, unknown> | null,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString()
        }

        return NextResponse.json(formattedEvent)
    } catch (error) {
        console.error('API: Unexpected error in event fetch:', error)
        return NextResponse.json({
            error: 'Unexpected error occurred',
            message: 'An unexpected error occurred while processing your request.',
            details: error instanceof Error ? error.message : 'Unknown error',
            type: 'UNEXPECTED_ERROR',
            retryable: true
        }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<EventResponse>> {
    try {
        const { id } = await params
        console.log(`API: Starting event update for ID: ${id}`)

        // Using the global Prisma client singleton. Do not call $connect()/$disconnect() per-request

        let body: UpdateEventParams['data']
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

        // Check if event exists first
        let existingEvent
        try {
            existingEvent = await prisma.event.findUnique({
                where: { id }
            })
            
            if (!existingEvent) {
                return NextResponse.json({
                    error: 'Event not found',
                    message: `Event with ID ${id} was not found.`,
                    details: `No event exists with the provided ID: ${id}`,
                    type: 'NOT_FOUND_ERROR',
                    retryable: false
                }, { status: 404 })
            }
        } catch (findError) {
            console.error('API: Error finding event:', findError)
            return NextResponse.json({
                error: 'Failed to find event',
                message: 'Unable to find event for update. Please try again.',
                details: findError instanceof Error ? findError.message : 'Unknown find error',
                type: 'FIND_ERROR',
                retryable: true
            }, { status: 500 })
        }

        let updatedEvent
        try {
            const dataToUpdate: Prisma.EventUpdateInput = {}
            if (body.name) {
                dataToUpdate.name = body.name
            }
            if ('payload' in body) {
                dataToUpdate.payload = body.payload === null ? Prisma.JsonNull : body.payload as Prisma.InputJsonValue;
            }

            updatedEvent = await prisma.event.update({
                where: { id },
                data: dataToUpdate,
            })
            console.log(`API: Successfully updated event: ${updatedEvent.name}`)
        } catch (updateError) {
            console.error('API: Error updating event:', updateError)
            return NextResponse.json({
                error: 'Failed to update event',
                message: 'Unable to update event. Please try again.',
                details: updateError instanceof Error ? updateError.message : 'Unknown update error',
                type: 'UPDATE_ERROR',
                retryable: true
            }, { status: 500 })
        }

        const formattedEvent = {
            id: updatedEvent.id,
            name: updatedEvent.name,
            payload: updatedEvent.payload as Record<string, unknown> | null,
            createdAt: updatedEvent.createdAt.toISOString(),
            updatedAt: updatedEvent.updatedAt.toISOString()
        }

        return NextResponse.json(formattedEvent)
    } catch (error) {
        console.error('API: Unexpected error in event update:', error)
        return NextResponse.json({
            error: 'Unexpected error occurred',
            message: 'An unexpected error occurred while processing your request.',
            details: error instanceof Error ? error.message : 'Unknown error',
            type: 'UNEXPECTED_ERROR',
            retryable: true
        }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params
        console.log(`API: Starting event deletion for ID: ${id}`)

        // Using the global Prisma client singleton. Do not call $connect()/$disconnect() per-request

        // Check if event exists first
        let existingEvent
        try {
            existingEvent = await prisma.event.findUnique({
                where: { id }
            })
            
            if (!existingEvent) {
                return NextResponse.json({
                    error: 'Event not found',
                    message: `Event with ID ${id} was not found.`,
                    details: `No event exists with the provided ID: ${id}`,
                    type: 'NOT_FOUND_ERROR',
                    retryable: false
                }, { status: 404 })
            }
        } catch (findError) {
            console.error('API: Error finding event:', findError)
            return NextResponse.json({
                error: 'Failed to find event',
                message: 'Unable to find event for deletion. Please try again.',
                details: findError instanceof Error ? findError.message : 'Unknown find error',
                type: 'FIND_ERROR',
                retryable: true
            }, { status: 500 })
        }

        try {
            await prisma.event.delete({
                where: { id }
            })
            console.log(`API: Successfully deleted event: ${existingEvent.name}`)
        } catch (deleteError) {
            console.error('API: Error deleting event:', deleteError)
            return NextResponse.json({
                error: 'Failed to delete event',
                message: 'Unable to delete event. Please try again.',
                details: deleteError instanceof Error ? deleteError.message : 'Unknown delete error',
                type: 'DELETE_ERROR',
                retryable: true
            }, { status: 500 })
        }

        return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 })
    } catch (error) {
        console.error('API: Unexpected error in event deletion:', error)
        return NextResponse.json({
            error: 'Unexpected error occurred',
            message: 'An unexpected error occurred while processing your request.',
            details: error instanceof Error ? error.message : 'Unknown error',
            type: 'UNEXPECTED_ERROR',
            retryable: true
        }, { status: 500 })
    }
}
