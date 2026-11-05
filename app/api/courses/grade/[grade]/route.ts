import { NextResponse } from 'next/server'
import { getCoursesForGrade } from '@/lib/course-metadata'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ grade: string }> }
) {
    const { grade } = await params
    try {
        // Convert URL parameter to proper grade level format
        const gradeMap: Record<string, string> = {
            'middle-school': 'Middle School',
            'high-school': 'High School',
            'elementary': 'Elementary',
            'grade-1': 'Grade 1',
            'grade-2': 'Grade 2',
            'grade-3': 'Grade 3',
            'grade-4': 'Grade 4',
            'grade-5': 'Grade 5'
        }

        const gradeLevel = gradeMap[grade] || grade
        const courses = await getCoursesForGrade(gradeLevel)

        return NextResponse.json(courses)
    } catch (error) {
        console.error('Error loading courses by grade:', error)
        return NextResponse.json(
            { error: 'Failed to load courses by grade' },
            { status: 500 }
        )
    }
} 