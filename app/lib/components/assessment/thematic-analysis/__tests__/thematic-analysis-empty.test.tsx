import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThematicAnalysisEmpty } from '../thematic-analysis-empty'

describe('ThematicAnalysisEmpty', () => {
  it('should render no-responses message when variant is no-responses', () => {
    render(<ThematicAnalysisEmpty variant="no-responses" />)

    expect(screen.getByText('No Analysis Yet')).toBeInTheDocument()
    expect(
      screen.getByText(
        'We will generate thematic patterns once student responses are in!',
      ),
    ).toBeInTheDocument()
  })

  it('should render generating message when variant is generating', () => {
    render(<ThematicAnalysisEmpty variant="generating" />)

    expect(screen.getByText('Generating Analysis...')).toBeInTheDocument()
    expect(
      screen.getByText(
        'We are generating the assessment patterns right now, stay tuned!',
      ),
    ).toBeInTheDocument()
  })

  it('should show animated dots when generating', () => {
    const { container } = render(
      <ThematicAnalysisEmpty variant="generating" />,
    )

    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })

  it('should not show animated dots for no-responses variant', () => {
    const { container } = render(
      <ThematicAnalysisEmpty variant="no-responses" />,
    )

    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(0)
  })

  it('should render ready message when responses exist but analysis has not run', () => {
    render(<ThematicAnalysisEmpty variant="ready" />)

    expect(screen.getByText('No Analysis Yet')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Student responses are ready. Run analysis to generate thematic patterns.',
      ),
    ).toBeInTheDocument()
  })

  it('should render failed message when variant is failed', () => {
    render(<ThematicAnalysisEmpty variant="failed" />)

    expect(screen.getByText('Analysis Failed')).toBeInTheDocument()
    expect(
      screen.getByText(
        "We couldn't generate thematic patterns. Try running the analysis again.",
      ),
    ).toBeInTheDocument()
  })

  it('should not show animated dots for failed variant', () => {
    const { container } = render(<ThematicAnalysisEmpty variant="failed" />)

    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(0)
  })
})
