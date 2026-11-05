import fs from 'node:fs'
import path from 'node:path'
import type { CourseMetadata, ComprehensiveMetadata, UnitWithCourseContext } from './course-types'

// Cache for the metadata to avoid repeated file reads
let metadataCache: ComprehensiveMetadata | null = null

/**
 * Load the comprehensive course metadata from the JSON file
 * This function is server-side only
 */
export async function loadCourseMetadata(): Promise<ComprehensiveMetadata> {
    if (metadataCache) {
        return metadataCache
    }

    try {
        const metadataPath = path.join(process.cwd(), 'data', 'seed', 'openscied_course_metadata_comprehensive.json')
        const fileContent = fs.readFileSync(metadataPath, 'utf8')
        metadataCache = JSON.parse(fileContent) as ComprehensiveMetadata
        return metadataCache
    } catch (error) {
        console.error('Error loading course metadata:', error)
        throw new Error('Failed to load course metadata')
    }
}

/**
 * Get all courses grouped by grade level
 */
export async function getCoursesByGradeLevel(): Promise<Record<string, CourseMetadata[]>> {
    const metadata = await loadCourseMetadata()
    const coursesByGrade: Record<string, CourseMetadata[]> = {}

    // Use only dynamic data from the courses object
    for (const course of Object.values(metadata.courses)) {
        const gradeLevel = course.grade_level || 'Unknown'
        if (!coursesByGrade[gradeLevel]) {
            coursesByGrade[gradeLevel] = []
        }
        coursesByGrade[gradeLevel].push(course)
    }

    return coursesByGrade
}

/**
 * Get courses by subject
 */
export async function getCoursesBySubject(): Promise<Record<string, CourseMetadata[]>> {
    const metadata = await loadCourseMetadata()
    const coursesBySubject: Record<string, CourseMetadata[]> = {}

    // Use only dynamic data from the courses object
    for (const course of Object.values(metadata.courses)) {
        const subject = course.subject || 'Science'
        if (!coursesBySubject[subject]) {
            coursesBySubject[subject] = []
        }
        coursesBySubject[subject].push(course)
    }

    return coursesBySubject
}

/**
 * Get a specific course by ID
 */
export async function getCourseById(courseId: string): Promise<CourseMetadata | null> {
    const metadata = await loadCourseMetadata()

    // Use only dynamic data from the courses object
    return metadata.courses[courseId] || null
}

/**
 * Get all courses with processing status information
 */
export async function getAllCourses(): Promise<CourseMetadata[]> {
    const metadata = await loadCourseMetadata()

    // Use only dynamic data from the courses object
    return Object.values(metadata.courses)
}

/**
 * Get courses for a specific grade level
 */
export async function getCoursesForGrade(gradeLevel: string): Promise<CourseMetadata[]> {
    const coursesByGrade = await getCoursesByGradeLevel()
    console.log(coursesByGrade)
    return coursesByGrade[gradeLevel] || []
}

/**
 * Get courses for a specific subject
 */
export async function getCoursesForSubject(subject: string): Promise<CourseMetadata[]> {
    const coursesBySubject = await getCoursesBySubject()
    return coursesBySubject[subject] || []
}

/**
 * Get statistics about the course metadata
 */
export async function getCourseStatistics() {
    const metadata = await loadCourseMetadata()

    // Use only dynamic data from the courses object
    const allCourses = Object.values(metadata.courses)

    const stats = {
        totalCourses: allCourses.length,
        totalUnits: metadata.total_units,
        byGradeLevel: {} as Record<string, number>,
        bySubject: {} as Record<string, number>,
        byStatus: {} as Record<string, number>
    }

    for (const course of allCourses) {
        const gradeLevel = course.grade_level || 'Unknown'
        const subject = course.subject || 'Science'
        const status = course.status || 'unknown'

        stats.byGradeLevel[gradeLevel] = (stats.byGradeLevel[gradeLevel] || 0) + 1
        stats.bySubject[subject] = (stats.bySubject[subject] || 0) + 1
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
    }

    return stats
}

/**
 * Search courses by title, description, or subject
 */
export async function searchCourses(query: string): Promise<CourseMetadata[]> {
    const allCourses = await getAllCourses()
    const searchTerm = query.toLowerCase()

    return allCourses.filter(course =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm) ||
        course.subject.toLowerCase().includes(searchTerm) ||
        course.grade_level.toLowerCase().includes(searchTerm)
    )
}

/**
 * Get courses with NGSS standards
 */
export async function getCoursesWithNGSSStandards(): Promise<CourseMetadata[]> {
    const allCourses = await getAllCourses()
    return allCourses.filter(course =>
        course.ngss_standards && course.ngss_standards.length > 0
    )
}

/**
 * Get courses by processing status
 */
export async function getCoursesByStatus(status: string): Promise<CourseMetadata[]> {
    const allCourses = await getAllCourses()
    return allCourses.filter(course => course.status === status)
}

/**
 * Get all units for a specific grade level
 */
export async function getUnitsForGrade(gradeLevel: string): Promise<UnitWithCourseContext[]> {
    const courses = await getCoursesForGrade(gradeLevel)
    const units: UnitWithCourseContext[] = []

    for (const course of courses) {
        if (course.units && Array.isArray(course.units)) {
            for (const unit of course.units) {
                // Add course context to the unit
                const unitWithContext: UnitWithCourseContext = {
                    ...unit,
                    course_id: course.course_id,
                    course_title: course.title,
                    course_description: course.description
                }
                units.push(unitWithContext)
            }
        }
    }

    return units
}

/**
 * Get a specific unit by ID and grade level
 */
export async function getUnitById(unitId: string, gradeLevel: string): Promise<UnitWithCourseContext | null> {  
    console.log(`Fetching unit ${unitId} for grade level ${gradeLevel}`)
    const units = await getUnitsForGrade(gradeLevel)
    return units.find(unit => unit.unit_id === unitId) || null
} 