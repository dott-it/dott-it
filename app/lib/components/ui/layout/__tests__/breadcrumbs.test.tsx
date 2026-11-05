import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from '../breadcrumbs'

describe('Breadcrumbs', () => {
  const mockItems = [
    { label: 'Home', href: '/' },
    { label: 'Workspace', href: '/workspace' },
    { label: 'Assessment', isLast: true }
  ]

  it('renders all breadcrumb items', () => {
    render(<Breadcrumbs items={mockItems} />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByText('Assessment')).toBeInTheDocument()
  })

  it('renders links for non-last items', () => {
    render(<Breadcrumbs items={mockItems} />)
    
    const homeLink = screen.getByRole('link', { name: 'Home' })
    const workspaceLink = screen.getByRole('link', { name: 'Workspace' })
    
    expect(homeLink).toHaveAttribute('href', '/')
    expect(workspaceLink).toHaveAttribute('href', '/workspace')
  })

  it('renders last item as text without link', () => {
    render(<Breadcrumbs items={mockItems} />)
    
    const assessmentText = screen.getByText('Assessment')
    expect(assessmentText).not.toHaveAttribute('href')
  })

  it('has proper navigation role', () => {
    render(<Breadcrumbs items={mockItems} />)
    
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav).toBeInTheDocument()
  })

  it('renders with single item', () => {
    const singleItem = [{ label: 'Home', isLast: true }]
    render(<Breadcrumbs items={singleItem} />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
