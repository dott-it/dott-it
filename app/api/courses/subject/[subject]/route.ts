import { NextResponse } from 'next/server'
import { getCoursesForSubject } from '@/lib/course-metadata'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subject: string }> }
) {
  const { subject: subjectParam } = await params
  try {
    // Convert URL parameter to proper subject format
    const subjectMap: Record<string, string> = {
      'biology': 'Biology',
      'physics': 'Physics',
      'chemistry': 'Chemistry',
      'science': 'Science'
    }

    const subject = subjectMap[subjectParam] || subjectParam
    const courses = await getCoursesForSubject(subject)

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error loading courses by subject:', error)
    return NextResponse.json(
      { error: 'Failed to load courses by subject' },
      { status: 500 }
    )
  }
} 