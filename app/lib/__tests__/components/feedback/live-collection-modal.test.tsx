import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Image from 'next/image'
import { LiveCollectionModal } from '../../../components/ui/feedback/live-collection-modal'
import { Assessment } from '@/types'

// Note: Using real dialog components instead of mocking to avoid path issues

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(),
}
Object.assign(navigator, {
  clipboard: mockClipboard,
})

// Mock window.open
const mockOpen = jest.fn()
Object.defineProperty(globalThis, 'open', {
  value: mockOpen,
  writable: true,
})

// Mock EventsService
jest.mock('@/app/shared/services/events.service', () => {
  const mockEventsService = jest.fn().mockImplementation(() => ({
    createEvent: jest.fn(),
  }))
  return {
    EventsService: mockEventsService,
    createEvent: jest.fn(),
  }
})

// Mock next-qrcode
jest.mock('next-qrcode', () => ({
  useQRCode: () => ({
    Image: ({
      text,
      options,
      alt,
      className,
    }: {
      text: string
      options: unknown
      alt: string
      className: string
    }) => (
      <Image
        data-testid="qr-code"
        src={`data:image/png;base64,mock-qr-code-${text}`}
        alt={alt}
        className={className}
        data-text={text}
        data-options={JSON.stringify(options)}
        width={200}
        height={200}
      />
    ),
  }),
}))

// Note: Events service will be tested separately

const mockAssessment: Assessment = {
  id: 'test-assessment-123',
  tenantId: 'tenant-1',
  templateId: 'template-1',
  teacherId: 'teacher-1',
  assignedBy: 'teacher-1',
  assignedAt: '2024-05-01T00:00:00Z',
  dueAt: '2024-05-15T23:59:59Z',
  assignedTo: {},
  submissionUrl: 'https://example.com',
  status: 'live',
  instructions: 'Test instructions',
  numberOfQuestions: 5,
  title: 'Test Assessment',
  unitName: 'Test Unit',
  subject: 'Science',
  grade: 8,
  type: 'Constructed Response',
  dueDate: new Date('2024-05-15'),
  closeDate: new Date('2024-05-15'),
  totalRecords: 25,
  pendingRecords: 5,
  studentCount: 25,
  submissionStats: {
    readyForReview: 15,
    shared: 7,
  },
  description: 'Test assessment description',
}

describe('LiveCollectionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders when open', () => {
    render(<LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />)

    expect(screen.getByText('Assessment Handout')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Share this QR code or URL with your students to access the assessment form.',
      ),
    ).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <LiveCollectionModal assessment={mockAssessment} open={false} onOpenChange={jest.fn()} />,
    )

    expect(screen.queryByText('Assessment Handout')).not.toBeInTheDocument()
  })

  it('displays assessment information', () => {
    render(<LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />)

    expect(screen.getByText('Test Assessment')).toBeInTheDocument()
    expect(screen.getByText('Test Unit • Grade 8')).toBeInTheDocument()
  })

  it('displays form URL with correct format', () => {
    render(<LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />)

    const urlInput = screen.getByDisplayValue((content) =>
      content.includes('localhost/form/'),
    )
    expect(urlInput).toBeInTheDocument()
    expect(urlInput).toHaveAttribute('readonly')
  })

  it('displays real QR code', () => {
    render(<LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />)

    expect(screen.getByTestId('qr-code')).toBeInTheDocument()
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument()
    expect(screen.getByText('Students can scan this code to access the form')).toBeInTheDocument()
  })

  it('has proper URL section labels', () => {
    render(<LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />)

    expect(screen.getByText('Or Share URL')).toBeInTheDocument()
    expect(screen.getByText('Copy and share this link with your students')).toBeInTheDocument()
  })

  it('renders copy button', () => {
    render(<LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4) // Close, Copy, Open Form, X button
  })

  it('renders open form button', () => {
    render(<LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />)

    const openFormButton = screen.getByRole('button', { name: /open form/i })
    expect(openFormButton).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(<LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />)

    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    expect(closeButtons).toHaveLength(2) // Footer Close button and X button
  })

  it('copies URL to clipboard when copy button is clicked', async () => {
    render(<LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />)

    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('localhost/form/'),
      )
    })

    // Check that button text changes to "Copied!"
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })
  })

  it('opens form in new tab when open form button is clicked', () => {
    render(<LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />)

    const openFormButton = screen.getByRole('button', { name: /open form/i })
    fireEvent.click(openFormButton)

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('localhost/form/'),
      '_blank',
    )
  })

  it('generates consistent slug for same assessment ID', () => {
    const { rerender } = render(
      <LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />,
    )

    const firstUrl = (screen.getByDisplayValue((content) =>
      content.includes('localhost/form/'),
    ) as HTMLInputElement).value

    rerender(
      <LiveCollectionModal assessment={mockAssessment} open={true} onOpenChange={jest.fn()} />,
    )

    const secondUrl = (screen.getByDisplayValue((content) =>
      content.includes('localhost/form/'),
    ) as HTMLInputElement).value

    expect(firstUrl).toBe(secondUrl)
  })

  it('calls onOpenChange when close button is clicked', async () => {
    const mockOnOpenChange = jest.fn()

    render(
      <LiveCollectionModal
        assessment={mockAssessment}
        open={true}
        onOpenChange={mockOnOpenChange}
        location="workspace"
      />,
    )

    // Find the footer close button by looking for the one that doesn't have an SVG icon
    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    const footerCloseButton = closeButtons.find((button) => !button.querySelector('svg'))

    expect(footerCloseButton).toBeTruthy()
    fireEvent.click(footerCloseButton!)

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('accepts location prop for tracking context', () => {
    render(
      <LiveCollectionModal
        assessment={mockAssessment}
        open={true}
        onOpenChange={jest.fn()}
        location="class"
      />,
    )

    // Component should render without errors when location is provided
    expect(screen.getByText('Assessment Handout')).toBeInTheDocument()
  })
})
