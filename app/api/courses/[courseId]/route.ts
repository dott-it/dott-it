import { NextResponse } from 'next/server'
import { getCourseById } from '@/lib/course-metadata'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    const { courseId } = await params
    try {
        const course = await getCourseById(courseId)

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(course)
    } catch (error) {
        console.error('Error loading course metadata:', error)
        return NextResponse.json(
            { error: 'Failed to load course metadata' },
            { status: 500 }
        )
    }
} 