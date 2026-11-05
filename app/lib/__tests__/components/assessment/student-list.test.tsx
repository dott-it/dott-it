import { render, screen, fireEvent } from '@testing-library/react'
import { StudentList } from '@/app/lib/components/assessment/student-list'
import { AssessmentRecord } from '@/types'

// Mock student data
const mockStudents: AssessmentRecord[] = [
  {
    id: '1',
    tenantId: 'tenant1',
    assessmentId: 'assessment1',
    classSection: '1st hour',
    learnerId: 'learner1',
    learnerName: 'Blue Whale',
    rawAnswer: {},
    submittedAt: new Date('2024-05-10T10:30:00Z'),
    status: 'ready_for_review',
    rubricScore: '85',
    details: 'Good work',
    type: 'assessment',
    teacherScore: '85',
    numberOfQuestions: '5',
    createdAt: new Date('2024-05-10T10:30:00Z'),
    updatedAt: new Date('2024-05-10T10:30:00Z'),
  },
  {
    id: '2',
    tenantId: 'tenant1',
    assessmentId: 'assessment1',
    classSection: '1st hour',
    learnerId: 'learner2',
    learnerName: 'Red Fox',
    rawAnswer: {},
    submittedAt: new Date('2024-05-09T14:20:00Z'),
    status: 'shared',
    rubricScore: '72',
    details: 'Needs improvement',
    type: 'assessment',
    teacherScore: '72',
    numberOfQuestions: '5',
    createdAt: new Date('2024-05-09T14:20:00Z'),
    updatedAt: new Date('2024-05-09T14:20:00Z'),
  },
  {
    id: '3',
    tenantId: 'tenant1',
    assessmentId: 'assessment1', 
    classSection: '2st hour',
    learnerId: 'learner3',
    learnerName: 'Green Turtle',
    rawAnswer: {},
    submittedAt: new Date('2024-05-08T16:45:00Z'),
    status: 'shared',
    rubricScore: '95',
    details: 'Excellent work',
    type: 'assessment',
    teacherScore: '95',
    numberOfQuestions: '5',
    createdAt: new Date('2024-05-08T16:45:00Z'),
    updatedAt: new Date('2024-05-08T16:45:00Z'),
  },
]

describe('StudentList', () => {
  it('renders student records table header', () => {
    render(<StudentList assessmentRecords={mockStudents} />)

    expect(screen.getByText('Student Records')).toBeInTheDocument()
  })

  it('renders search input and filters', () => {
    render(<StudentList assessmentRecords={mockStudents} />)

    expect(screen.getByPlaceholderText('Search students...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All Status')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All Classes')).toBeInTheDocument()
  })

  it('displays spirit animal names by default', () => {
    render(<StudentList assessmentRecords={mockStudents} />)

    // Should show spirit animal names by default (not real names)
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument()
    
    // Should show some spirit animal names (format: Color Animal)
    const spiritAnimalPattern = /^[A-Za-z]+ [A-Za-z]+$/
    const nameElements = screen.getAllByText(spiritAnimalPattern)
    expect(nameElements.length).toBeGreaterThan(0)
  })

  it('displays real names when showRealNames is true', () => {
    const originalSalt = process.env.NEXT_PUBLIC_STUDENT_NAME_SALT
    process.env.NEXT_PUBLIC_STUDENT_NAME_SALT = 'test-salt'

    try {
      render(<StudentList assessmentRecords={mockStudents} showRealNames={true} />)

      expect(screen.getByText('Blue Whale')).toBeInTheDocument()
      expect(screen.getByText('Red Fox')).toBeInTheDocument()
      expect(screen.getByText('Green Turtle')).toBeInTheDocument()
    } finally {
      if (originalSalt === undefined) {
        delete process.env.NEXT_PUBLIC_STUDENT_NAME_SALT
      } else {
        process.env.NEXT_PUBLIC_STUDENT_NAME_SALT = originalSalt
      }
    }
  })

  it('handles search input changes', () => {
    render(<StudentList assessmentRecords={mockStudents} />)

    const searchInput = screen.getByPlaceholderText('Search students...')
    fireEvent.change(searchInput, { target: { value: 'Blue' } })

    expect(searchInput).toHaveValue('Blue')
  })

  it('handles status filter changes', () => {
    render(<StudentList assessmentRecords={mockStudents} />)

    const statusSelect = screen.getByDisplayValue('All Status')
    fireEvent.change(statusSelect, { target: { value: 'ready_for_review' } })

    expect(statusSelect).toHaveValue('ready_for_review')
  })

  it('handles class filter changes', () => {
    render(<StudentList assessmentRecords={mockStudents} />)

    const classSelect = screen.getByDisplayValue('All Classes')
    fireEvent.change(classSelect, { target: { value: '1st hour' } })

    expect(classSelect).toHaveValue('1st hour')
  })

  it('shows empty state when no students', () => {
    render(<StudentList assessmentRecords={[]} />)

    expect(screen.getByText(/No student submissions yet/)).toBeInTheDocument()
  })

  it('shows Export button and calls onExport when showExportButton and onExport are provided', () => {
    const mockOnExport = jest.fn()
    render(
      <StudentList
        assessmentRecords={mockStudents}
        showExportButton
        onExport={mockOnExport}
      />,
    )

    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Export/i }))
    expect(mockOnExport).toHaveBeenCalledTimes(1)
  })

  it('does not show Export button when showExportButton is false', () => {
    const mockOnExport = jest.fn()
    render(
      <StudentList
        assessmentRecords={mockStudents}
        showExportButton={false}
        onExport={mockOnExport}
      />,
    )

    expect(screen.queryByRole('button', { name: /Export/i })).not.toBeInTheDocument()
  })

  it('shows icon-only toggle names button in filters when onToggleNames is provided', () => {
    const mockOnToggleNames = jest.fn()
    render(
      <StudentList
        assessmentRecords={mockStudents}
        onToggleNames={mockOnToggleNames}
      />,
    )

    const showNamesButton = screen.getByRole('button', { name: 'Show names' })
    expect(showNamesButton).toBeInTheDocument()
    expect(screen.queryByText('Show Names')).not.toBeInTheDocument()
    expect(screen.queryByText('Hide Names')).not.toBeInTheDocument()
    fireEvent.click(showNamesButton)
    expect(mockOnToggleNames).toHaveBeenCalledTimes(1)
  })

  it('toggle names button shows Hide names aria-label when showRealNames is true', () => {
    render(
      <StudentList
        assessmentRecords={mockStudents}
        showRealNames
        onToggleNames={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Hide names' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show names' })).not.toBeInTheDocument()
  })
})
