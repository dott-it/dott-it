import { NextResponse } from 'next/server'
import { getAllCourses, getCourseStatistics } from '@/lib/course-metadata'

export async function GET() {
    try {
        const [courses, stats] = await Promise.all([
            getAllCourses(),
            getCourseStatistics()
        ])

        return NextResponse.json({
            courses,
            statistics: stats
        })
    } catch (error) {
        console.error('Error loading course metadata:', error)
        return NextResponse.json(
            { error: 'Failed to load course metadata' },
            { status: 500 }
        )
    }
} 