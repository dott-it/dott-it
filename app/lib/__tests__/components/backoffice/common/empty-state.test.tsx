import { render, screen } from '@testing-library/react'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/backoffice/common/empty-state'

describe('EmptyState', () => {
  it('renders icon, title and description', () => {
    render(
      <EmptyState
        icon={FileText}
        title="No items found"
        description="There are no items to display"
      />,
    )

    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('There are no items to display')).toBeInTheDocument()
  })

  it('renders action button when actionLabel and actionHref are provided', () => {
    render(
      <EmptyState
        icon={FileText}
        title="No items found"
        description="There are no items to display"
        actionLabel="Create Item"
        actionHref="/create"
      />,
    )

    const actionButton = screen.getByRole('link', { name: /Create Item/i })
    expect(actionButton).toBeInTheDocument()
    expect(actionButton).toHaveAttribute('href', '/create')
  })

  it('does not render action button when actionLabel is not provided', () => {
    render(
      <EmptyState
        icon={FileText}
        title="No items found"
        description="There are no items to display"
        actionHref="/create"
      />,
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('does not render action button when actionHref is not provided', () => {
    render(
      <EmptyState
        icon={FileText}
        title="No items found"
        description="There are no items to display"
        actionLabel="Create Item"
      />,
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders icon in a circular container', () => {
    const { container } = render(
      <EmptyState
        icon={FileText}
        title="No items found"
        description="There are no items to display"
      />,
    )

    const iconContainer = container.querySelector('.rounded-full')
    expect(iconContainer).toBeInTheDocument()
  })
})

