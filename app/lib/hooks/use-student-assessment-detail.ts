import { useQuery } from '@tanstack/react-query'

// Extended StudentRecord interface for the detail view
export interface StudentAssessmentDetail {
  id: string
  name: string
  email?: string
  status: 'handed_in' | 'ready_for_review' | 'in_progress' | 'sent'
  submittedAt?: string
  score?: number
  maxScore?: number
  feedback?: string
  classSection?: string
  lastActionDate?: string
  totalResponses?: number
  lastFeedbackDate?: string
  grade?: number
}

// API response interface - updated to match the actual API response
export interface StudentAssessmentDetailResponse {
  id: string
  assessmentId: string
  studentName: string
  studentId: string
  email?: string
  classSection?: string
  status: string
  submittedAt?: string
  totalResponses: number
  lastFeedbackDate?: string
  score?: number
  maxScore?: number
  studentResponse?: string
  feedback: Array<{
    type: string
    section: string
    content: string
  }>
  assessment: {
    id: string
    title: string
    unitName: string
    subject: string
    grade: number
    type: string
    status: string
    dueDate: string
    description: string
  }
}

// API function to fetch student assessment detail
const fetchStudentAssessmentDetail = async (
  assessmentId: string,
  studentId: string,
): Promise<StudentAssessmentDetailResponse> => {
  // Try mock API first
  const mockResponse = await fetch(
    `/api/student-assessment-detail?assessmentId=${encodeURIComponent(
      assessmentId,
    )}&studentId=${encodeURIComponent(studentId)}`,
  )

  if (mockResponse.ok) {
    const mockData = await mockResponse.json()

    // Transform mock data to match the expected interface
    return {
      id: mockData.student.id,
      assessmentId: mockData.assessment.id,
      studentName: mockData.student.name,
      studentId: mockData.student.id,
      email: mockData.student.email,
      classSection: mockData.student.classSection,
      status: mockData.student.status,
      submittedAt: mockData.student.submittedAt,
      totalResponses: mockData.student.totalResponses,
      lastFeedbackDate: mockData.student.lastFeedbackDate,
      score: mockData.student.score,
      maxScore: 100, // Default max score
      studentResponse: mockData.studentResponse,
      feedback: mockData.feedback || [], // Use actual feedback from mock
      assessment: {
        id: mockData.assessment.id,
        title: mockData.assessment.title,
        unitName: mockData.assessment.unitName,
        subject: mockData.assessment.subject,
        grade: mockData.assessment.grade,
        type: mockData.assessment.type,
        status: mockData.assessment.status,
        dueDate: mockData.assessment.dueDate,
        description: mockData.assessment.description,
      },
    }
  }

  // Fallback to original API if mock fails
  const response = await fetch(
    `/api/student-assessment-detail?assessmentId=${encodeURIComponent(
      assessmentId,
    )}&studentId=${encodeURIComponent(studentId)}`,
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch student assessment detail: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

export function useStudentAssessmentDetail(assessmentId: string, studentId: string) {
  return useQuery({
    queryKey: ['student-assessment-detail', assessmentId, studentId],
    queryFn: () => fetchStudentAssessmentDetail(assessmentId, studentId),
    enabled: Boolean(assessmentId && studentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
