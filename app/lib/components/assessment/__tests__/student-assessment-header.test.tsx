import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { StudentAssessmentHeader } from '../student-assessment-header'

// Mock the dependencies
jest.mock('@/app/lib/components/ui/layout', () => ({
  GenericPageHeader: ({
    title,
    breadcrumbItems,
    showBackButton,
    onBack,
  }: {
    title?: string
    breadcrumbItems: { label: string; href?: string; isLast?: boolean }[]
    showBackButton?: boolean
    onBack: () => void
  }) => (
    <div data-testid="generic-page-header">
      {showBackButton && onBack && (
        <button onClick={onBack}>Back</button>
      )}
      {title ? <h1>{title}</h1> : null}
      <nav data-testid="breadcrumbs">
        {breadcrumbItems.map((item) => (
          <a key={item.label} href={item.href} data-testid={`crumb-${item.label}`}>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  ),
}))

describe('StudentAssessmentHeader', () => {
  const mockProps = {
    assessment: {
      id: 'assessment-123',
      title: 'Science Assessment',
      unitName: 'Unit 1: Introduction',
      tenantId: 'tenant-123',
      templateId: 'template-123',
      teacherId: 'teacher-123',
      assignedBy: 'admin-123',
      assignedAt: '2024-01-01T00:00:00Z',
      dueAt: '2024-01-31T23:59:59Z',
      assignedTo: {},
      status: 'live',
      numberOfQuestions: 5,
      totalRecords: 10,
    },
    studentName: 'John Doe',
    onBack: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders header with breadcrumb and no title', () => {
    render(<StudentAssessmentHeader {...mockProps} />)

    expect(screen.getByTestId('generic-page-header')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(screen.getByTestId('breadcrumbs')).toHaveTextContent(/Workspace.*Assessments.*Science Assessment.*John Doe/)
  })

  it('links the assessment breadcrumb to the student records tab', () => {
    render(<StudentAssessmentHeader {...mockProps} />)

    expect(screen.getByTestId('crumb-Science Assessment')).toHaveAttribute(
      'href',
      '/workspace/assessments/assessment-123?tab=students',
    )
  })

  it('calls onBack when back button is clicked', () => {
    render(<StudentAssessmentHeader {...mockProps} />)

    const backButton = screen.getByText('Back')
    fireEvent.click(backButton)

    expect(mockProps.onBack).toHaveBeenCalledTimes(1)
  })

  it('shows Back button when onBack is provided', () => {
    render(<StudentAssessmentHeader {...mockProps} />)

    expect(screen.getByText('Back')).toBeInTheDocument()
  })
})
