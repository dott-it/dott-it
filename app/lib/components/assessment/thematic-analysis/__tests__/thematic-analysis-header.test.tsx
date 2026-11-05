import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThematicAnalysisHeader } from '../thematic-analysis-header'

describe('ThematicAnalysisHeader', () => {
  const defaultProps = {
    responsesCount: 52,
    onRerun: jest.fn(),
    isRerunning: false,
    hasExistingAnalysis: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the title and responses count', () => {
    render(<ThematicAnalysisHeader {...defaultProps} />)

    expect(
      screen.getByText('What Students Are Working On'),
    ).toBeInTheDocument()
    expect(screen.getByText('52 Student Responses')).toBeInTheDocument()
  })

  it('should render "Re-run analysis" when analysis exists', () => {
    render(<ThematicAnalysisHeader {...defaultProps} hasExistingAnalysis={true} />)

    expect(screen.getByText('Re-run analysis')).toBeInTheDocument()
  })

  it('should render "Run analysis" when no analysis exists', () => {
    render(<ThematicAnalysisHeader {...defaultProps} hasExistingAnalysis={false} />)

    expect(screen.getByText('Run analysis')).toBeInTheDocument()
  })

  it('should call onRerun when re-run button is clicked', () => {
    render(<ThematicAnalysisHeader {...defaultProps} />)

    fireEvent.click(screen.getByText('Re-run analysis'))
    expect(defaultProps.onRerun).toHaveBeenCalledTimes(1)
  })

  it('should disable re-run button when isRerunning is true', () => {
    render(<ThematicAnalysisHeader {...defaultProps} isRerunning={true} />)

    const button = screen.getByText('Re-run analysis').closest('button')
    expect(button).toBeDisabled()
  })

  it('should not render a names toggle', () => {
    render(<ThematicAnalysisHeader {...defaultProps} />)

    expect(screen.queryByText('Names')).not.toBeInTheDocument()
  })
})
