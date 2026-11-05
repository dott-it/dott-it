import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SimplePageHeader } from '@/app/lib/components/ui/layout/header/simple-page-header'
import { Plus, Settings } from 'lucide-react'

describe('SimplePageHeader', () => {
  it('renders title', () => {
    render(<SimplePageHeader title="Test Page" />)

    expect(screen.getByText('Test Page')).toBeInTheDocument()
  })

  it('renders title and description', () => {
    render(<SimplePageHeader title="Test Page" description="This is a test page description" />)

    expect(screen.getByText('Test Page')).toBeInTheDocument()
    expect(screen.getByText('This is a test page description')).toBeInTheDocument()
  })

  it('renders without actions', () => {
    render(<SimplePageHeader title="Test Page" />)

    // Should not have any buttons
    const buttons = screen.queryAllByRole('button')
    expect(buttons).toHaveLength(0)
  })

  it('renders single action with href', () => {
    render(
      <SimplePageHeader
        title="Test Page"
        actions={[
          {
            label: 'Create New',
            href: '/create',
            icon: <Plus className="mr-2 size-4" />,
            variant: 'primary',
          },
        ]}
      />,
    )

    const link = screen.getByRole('link', { name: /create new/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/create')
  })

  it('renders single action with onClick', () => {
    const mockClick = jest.fn()
    render(
      <SimplePageHeader
        title="Test Page"
        actions={[
          {
            label: 'Click Me',
            onClick: mockClick,
            variant: 'secondary',
          },
        ]}
      />,
    )

    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)

    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('renders multiple actions', () => {
    render(
      <SimplePageHeader
        title="Test Page"
        actions={[
          {
            label: 'Create',
            href: '/create',
            variant: 'primary',
          },
          {
            label: 'Settings',
            href: '/settings',
            variant: 'outline',
          },
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: /create/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders action with icon', () => {
    const { container } = render(
      <SimplePageHeader
        title="Test Page"
        actions={[
          {
            label: 'Settings',
            href: '/settings',
            icon: <Settings className="mr-2 size-4" />,
          },
        ]}
      />,
    )

    const icon = container.querySelector('.lucide-settings')
    expect(icon).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<SimplePageHeader title="Test Page" className="custom-header" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-header')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<SimplePageHeader ref={ref} title="Test Page" />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('has correct default structure', () => {
    const { container } = render(<SimplePageHeader title="Test Page" description="Test description" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-between')
  })

  it('renders different button variants correctly', () => {
    render(
      <SimplePageHeader
        title="Test Page"
        actions={[
          { label: 'Primary', href: '/primary', variant: 'primary' },
          { label: 'Secondary', href: '/secondary', variant: 'secondary' },
          { label: 'Outline', href: '/outline', variant: 'outline' },
          { label: 'Ghost', href: '/ghost', variant: 'ghost' },
          { label: 'Default', href: '/default' }, // No variant specified
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: /primary/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /secondary/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /outline/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ghost/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /default/i })).toBeInTheDocument()
  })

  it('handles empty actions array', () => {
    render(<SimplePageHeader title="Test Page" actions={[]} />)

    const buttons = screen.queryAllByRole('button')
    const links = screen.queryAllByRole('link')

    expect(buttons).toHaveLength(0)
    expect(links).toHaveLength(0)
  })
})
