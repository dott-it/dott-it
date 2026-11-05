import { AssessmentRecord } from '../api'
import { Assessment, StudentRecord } from '../api/assessment'
import { ServiceOptions } from '../api/common.api'

/**
 * Assessment Hook Return Type
 */
export interface UseAssessmentReturn {
  assessments: Assessment[]
  currentAssessment: Assessment | null
  isLoading: boolean
  error: string | null
  getAssessment: (id: string, options?: ServiceOptions<Assessment>) => Promise<Assessment | null>
  getAssessments: (options?: ServiceOptions<Assessment[]>) => Promise<Assessment[]>
  createAssessment: (data: Partial<Assessment>) => Promise<Assessment | null>
  updateAssessment: (id: string, data: Partial<Assessment>) => Promise<Assessment | null>
  deleteAssessment: (id: string) => Promise<boolean>
  refreshAssessments: () => Promise<void>
}

/**
 * Assessment Records Hook Return Type
 */
export interface UseAssessmentRecordsReturn {
  records: AssessmentRecord[]
  students: StudentRecord[]
  isLoading: boolean
  error: string | null
  getRecords: (assessmentId: string) => Promise<AssessmentRecord[]>
  getStudents: (assessmentId: string) => Promise<StudentRecord[]>
  updateRecord: (id: string, data: Partial<AssessmentRecord>) => Promise<AssessmentRecord | null>
  refreshRecords: () => Promise<void>
}

/**
 * Assessment Hook Options
 */
export interface UseAssessmentOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  onError?: (error: Error) => void
}

