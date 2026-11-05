import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeAccordion } from '../theme-accordion'
import type { ThematicAnalysisItem } from '@/types'

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

const mockItems: ThematicAnalysisItem[] = [
  {
    id: 'item-1',
    type: 'need',
    title: 'Biological Accuracy',
    description: 'Students struggle with accuracy of biological claims.',
    order: 0,
    citations: [
      {
        id: 'cite-1',
        learnerId: 'learner-1',
        learnerName: 'Lucas Anderson',
        highlights: ['Cancer wins because it steals resources from the body.'],
        annotation: 'Reflects a common misconception about cancer cell behavior.',
      },
    ],
  },
  {
    id: 'item-2',
    type: 'strength',
    title: 'Evidence Use',
    description: 'Students effectively cite evidence from the text.',
    order: 1,
    citations: [],
  },
  {
    id: 'item-3',
    type: 'need',
    title: 'Causal Reasoning',
    description: 'Students need to connect cause and effect more clearly.',
    order: 2,
    citations: [],
  },
]

describe('ThemeAccordion', () => {
  it('should render COMMON NEEDS and COMMON STRENGTHS headers', () => {
    render(
      <ThemeAccordion
        items={mockItems}
        assessmentId="assessment-1"
      />,
    )

    expect(screen.getByText('COMMON NEEDS')).toBeInTheDocument()
    expect(screen.getByText('COMMON STRENGTHS')).toBeInTheDocument()
  })

  it('should group items by type', () => {
    render(
      <ThemeAccordion
        items={mockItems}
        assessmentId="assessment-1"
      />,
    )

    expect(screen.getByText('Biological Accuracy')).toBeInTheDocument()
    expect(screen.getByText('Causal Reasoning')).toBeInTheDocument()
    expect(screen.getByText('Evidence Use')).toBeInTheDocument()
  })

  it('should render item descriptions', () => {
    render(
      <ThemeAccordion
        items={mockItems}
        assessmentId="assessment-1"
      />,
    )

    expect(
      screen.getByText('Students struggle with accuracy of biological claims.'),
    ).toBeInTheDocument()
  })

  it('should not render COMMON STRENGTHS when no strength items exist', () => {
    const needsOnly = mockItems.filter((i) => i.type === 'need')
    render(
      <ThemeAccordion
        items={needsOnly}
        assessmentId="assessment-1"
      />,
    )

    expect(screen.getByText('COMMON NEEDS')).toBeInTheDocument()
    expect(screen.queryByText('COMMON STRENGTHS')).not.toBeInTheDocument()
  })
})
