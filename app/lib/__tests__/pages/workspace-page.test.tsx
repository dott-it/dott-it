import React from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import WorkspacePage from '@/app/(dashboard)/workspace/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock fetch
globalThis.fetch = jest.fn()

// Create a new QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Wrapper component to provide QueryClient
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function mockJsonResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Map([['content-type', 'application/json']]),
    json: async () => payload,
    text: async () => JSON.stringify(payload),
    clone() {
      return this
    },
  }
}

describe('WorkspacePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful API response for the current-year assessment table
    const payload = [
      {
        id: '1',
        title: 'Live Assessment',
        unitName: '8.1',
        unitCode: '8.1',
        className: 'Hour 3',
        type: 'Formative',
        schoolYear: '2025-2026',
        studentResponsesCount: 10,
        hasThematicAnalysis: true,
        status: 'live',
        totalRecords: 10,
        pendingRecords: 2,
        dueAt: '2024-12-31',
        startDate: '2024-01-01',
      },
      {
        id: '2',
        title: 'Completed Assessment',
        unitName: '8.2',
        unitCode: '8.2',
        className: 'Hour 4',
        type: 'Summative',
        schoolYear: '2025-2026',
        studentResponsesCount: 15,
        hasThematicAnalysis: false,
        status: 'completed',
        totalRecords: 15,
        pendingRecords: 0,
        dueAt: '2024-06-30',
        startDate: '2024-01-01',
      },
    ]

    ;(fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/api/spotlight')) {
        return Promise.resolve(mockJsonResponse([]))
      }
      return Promise.resolve(mockJsonResponse(payload))
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders workspace page with header', async () => {
    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    )

    await screen.findByText('Workspace', {}, { timeout: 5000 })

    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByText('Manage your assessments and student responses')).toBeInTheDocument()
  }, 10_000)

  it('renders search input and prior years link', async () => {
    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    )

    await screen.findByPlaceholderText('Search assessments...', {}, { timeout: 10_000 })
    expect(screen.getByPlaceholderText('Search assessments...')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Prior years/i })).toHaveAttribute(
      'href',
      '/workspace/assessments/prior',
    )
  }, 15_000)

  it('renders assessment table rows for the current school year', async () => {
    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    )

    await screen.findByText('Live Assessment')
    expect(screen.getByText('Completed Assessment')).toBeInTheDocument()
    expect(screen.getByText('Current school year')).toBeInTheDocument()
    expect(screen.getByText('Hour 3')).toBeInTheDocument()
  })

  it('renders empty state when no assessments', async () => {
    const payload: unknown[] = []
    ;(fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/api/spotlight')) {
        return Promise.resolve(mockJsonResponse([]))
      }
      return Promise.resolve(mockJsonResponse(payload))
    })

    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    )

    await screen.findByText('No assessments found')
    expect(
      screen.getByText(/You have no assessments for the current school year/),
    ).toBeInTheDocument()
  })
})
