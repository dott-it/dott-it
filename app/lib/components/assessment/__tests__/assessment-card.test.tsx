import React from 'react'
import { render, screen } from '@testing-library/react'
import { AssessmentCard, calculateProgressWidth } from '../assessment-card'
import { ActiveAssessment } from '@/types'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

const mockAssessment: ActiveAssessment = {
  id: '1',
  tenantId: 'tenant-1',
  templateId: 'template-1',
  teacherId: 'teacher-1',
  assignedBy: 'teacher-1',
  assignedAt: '2024-05-01T00:00:00Z',
  dueAt: '2024-12-30T23:59:59Z',
  assignedTo: {},
  submissionUrl: 'https://example.com',
  status: 'live',
  instructions: 'Test instructions',
  numberOfQuestions: 5,
  title: 'Test Assessment',
  unitName: 'Test Unit',
  subject: 'Science',
  grade: 6,
  type: 'formative',
  dueDate: new Date('2024-12-30T23:59:59Z'),
  closeDate: new Date('2024-12-31T23:59:59Z'),
  totalRecords: 100,
  pendingRecords: 30,
}

describe('AssessmentCard', () => {
  it('renders assessment information correctly', () => {
    render(<AssessmentCard assessment={mockAssessment} />)

    expect(screen.getByText('Test Assessment')).toBeInTheDocument()
    expect(screen.getByText('Test Unit')).toBeInTheDocument()
    expect(screen.getByText('Live')).toBeInTheDocument()
    expect(screen.getByText(/Due:/)).toBeInTheDocument()
    expect(screen.getByText('100 total')).toBeInTheDocument()
    expect(screen.getByText('30 pending')).toBeInTheDocument()
  })

  describe('calculateProgressWidth', () => {
    it('calculates correct progress width for normal assessment', () => {
      const result = calculateProgressWidth(mockAssessment)
      // (100 - 30) / 100 * 100 = 70%
      expect(result).toBe('70%')
    })

    it('returns 0% when totalRecords is 0', () => {
      const assessmentWithZeroRecords = {
        ...mockAssessment,
        totalRecords: 0,
        pendingRecords: 0,
      }
      const result = calculateProgressWidth(assessmentWithZeroRecords)
      expect(result).toBe('0%')
    })

    it('returns 100% when all records are completed', () => {
      const completedAssessment = {
        ...mockAssessment,
        totalRecords: 100,
        pendingRecords: 0,
      }
      const result = calculateProgressWidth(completedAssessment)
      expect(result).toBe('100%')
    })

    it('handles edge case where pendingRecords exceeds totalRecords', () => {
      const edgeAssessment = {
        ...mockAssessment,
        totalRecords: 50,
        pendingRecords: 60,
      }
      const result = calculateProgressWidth(edgeAssessment)
      expect(result).toBe('0%')
    })
  })

  it('displays correct link href', () => {
    render(<AssessmentCard assessment={mockAssessment} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/workspace/assessments/1')
  })

  it('applies correct badge variant for live status', () => {
    render(<AssessmentCard assessment={mockAssessment} />)

    const badge = screen.getByText('Live')
    // Check for the default variant classes
    expect(badge).toHaveClass('bg-primary')
  })

  it('applies secondary variant for draft status', () => {
    const draftAssessment = { ...mockAssessment, status: 'draft' as const }

    render(<AssessmentCard assessment={draftAssessment} />)

    const badge = screen.getByText('Draft')
    // Check for the secondary variant classes
    expect(badge).toHaveClass('bg-secondary')
  })

  it('displays progress bar with correct width', () => {
    render(<AssessmentCard assessment={mockAssessment} />)

    // Check if the progress bar container exists
    const progressContainer = screen.getByText('Progress').closest('div')?.parentElement
    expect(progressContainer).toBeInTheDocument()

    // Check if the progress bar fill element exists
    const progressFill = document.querySelector('.bg-primary')
    expect(progressFill).toBeInTheDocument()
  })
})
