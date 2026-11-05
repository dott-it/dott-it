export interface CourseMetadata {
    course_id: string
    title: string
    description: string
    grade_level: string
    subject: string
    units: UnitMetadata[]
    unit_count: number
    ngss_standards: string[]
    status?: string
    sections?: CourseSection[]
}

export interface UnitAssessment {
    id: string
    title: string
    description: string
    dueDate: string
    totalRecords: number
    pendingRecords: number
    type: string
}

export interface UnitMetadata {
    unit_id: string
    grade_level: string
    subject: string
    status: string
    lessons: string[]
    unit_materials: boolean
    other_materials: boolean
    assessments?: UnitAssessment[]
}

export interface UnitWithCourseContext extends UnitMetadata {
    course_id: string
    course_title: string
    course_description: string
}

export interface CourseSection {
    heading: string
    lessons: LessonMetadata[]
    wp_id?: string | null
}

export interface LessonMetadata {
    title: string
    description: string | null
    topics: TopicMetadata[]
    reflection?: string | null
    wp_id?: string | null
}

export interface TopicMetadata {
    title: string
    content: string
    reflection?: string | null
    wp_id?: string | null
}

export interface ComprehensiveMetadata {
    generated_at: string
    total_units: number
    total_courses: number
    existing_courses: CourseMetadata[]
    courses: Record<string, CourseMetadata>
} 