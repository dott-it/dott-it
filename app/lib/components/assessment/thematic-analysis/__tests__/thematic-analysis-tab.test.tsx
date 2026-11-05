import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ThematicAnalysisTab } from '../thematic-analysis-tab'
import { thematicAnalysisQueries } from '@/app/lib/services/thematic-analysis/thematic-analysis.queries'

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

jest.mock('@/app/lib/services/thematic-analysis/thematic-analysis.queries', () => {
  const actual = jest.requireActual(
    '@/app/lib/services/thematic-analysis/thematic-analysis.queries',
  )
  return {
    ...actual,
    thematicAnalysisQueries: {
      ...actual.thematicAnalysisQueries,
      getThematicAnalysis: {
        ...actual.thematicAnalysisQueries.getThematicAnalysis,
        useQuery: jest.fn(),
        getKey: actual.thematicAnalysisQueries.getThematicAnalysis.getKey,
      },
      triggerAnalysis: {
        ...actual.thematicAnalysisQueries.triggerAnalysis,
        useMutation: jest.fn(),
      },
    },
  }
})

const mockUseQuery = thematicAnalysisQueries.getThematicAnalysis
  .useQuery as jest.Mock
const mockUseMutation = thematicAnalysisQueries.triggerAnalysis
  .useMutation as jest.Mock

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ThematicAnalysisTab
        assessmentId="assess-1"
        hasResponses={true}
        responsesCount={3}
      />
    </QueryClientProvider>,
  )
}

describe('ThematicAnalysisTab', () => {
  const mutate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMutation.mockReturnValue({
      mutate,
      isPending: false,
    })
  })

  it('should show failed empty state when analysis query errors', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    })

    renderTab()

    expect(screen.getByText('Analysis Failed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run analysis' })).toBeInTheDocument()
  })

  it('should toast when trigger analysis mutation reports an error', async () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    let onError: ((error: Error) => void) | undefined
    let onSettled: (() => void) | undefined
    mockUseMutation.mockImplementation(
      (options: {
        onError?: (error: Error) => void
        onSettled?: () => void
      }) => {
        onError = options.onError
        onSettled = options.onSettled
        return { mutate, isPending: false }
      },
    )

    renderTab()

    fireEvent.click(screen.getByRole('button', { name: 'Run analysis' }))
    expect(mutate).toHaveBeenCalledWith({
      assessmentId: 'assess-1',
      includeNames: true,
    })
    expect(onSettled).toEqual(expect.any(Function))

    onError?.(new Error('Please wait before running analysis again'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to run analysis', {
        description: 'Please wait before running analysis again',
      })
    })
  })

  it('should show ready state when responses exist but analysis is missing', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    renderTab()

    expect(screen.getByText('No Analysis Yet')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Student responses are ready. Run analysis to generate thematic patterns.',
      ),
    ).toBeInTheDocument()
  })
})
