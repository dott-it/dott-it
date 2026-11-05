import React from 'react'
import { render, screen } from '@testing-library/react'
import { Badge, badgeVariants } from '@/app/lib/components/ui/feedback/badge'

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge>Default Badge</Badge>)
    const badge = screen.getByText('Default Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full')
  })

  it('renders with different variants', () => {
    const { rerender } = render(<Badge variant="default">Default</Badge>)
    expect(screen.getByText('Default')).toHaveClass('bg-primary', 'text-primary-foreground')

    rerender(<Badge variant="secondary">Secondary</Badge>)
    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary', 'text-secondary-foreground')

    rerender(<Badge variant="destructive">Destructive</Badge>)
    expect(screen.getByText('Destructive')).toHaveClass(
      'bg-destructive',
      'text-destructive-foreground',
    )

    rerender(<Badge variant="outline">Outline</Badge>)
    expect(screen.getByText('Outline')).toHaveClass('text-foreground')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>)
    const badge = screen.getByText('Custom Badge')
    expect(badge).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Badge ref={ref}>Ref Badge</Badge>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('applies all HTML attributes', () => {
    render(
      <Badge data-testid="badge" aria-label="Status badge">
        Accessible Badge
      </Badge>,
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('aria-label', 'Status badge')
  })
})

describe('badgeVariants', () => {
  it('generates correct classes for default variant', () => {
    const classes = badgeVariants({ variant: 'default' })
    expect(classes).toContain('bg-primary')
    expect(classes).toContain('text-primary-foreground')
  })

  it('generates correct classes for secondary variant', () => {
    const classes = badgeVariants({ variant: 'secondary' })
    expect(classes).toContain('bg-secondary')
    expect(classes).toContain('text-secondary-foreground')
  })

  it('generates correct classes for destructive variant', () => {
    const classes = badgeVariants({ variant: 'destructive' })
    expect(classes).toContain('bg-destructive')
    expect(classes).toContain('text-destructive-foreground')
  })

  it('generates correct classes for outline variant', () => {
    const classes = badgeVariants({ variant: 'outline' })
    expect(classes).toContain('text-foreground')
  })

  it('includes base classes for all variants', () => {
    const classes = badgeVariants({ variant: 'default' })
    expect(classes).toContain('inline-flex')
    expect(classes).toContain('items-center')
    expect(classes).toContain('rounded-full')
    expect(classes).toContain('border')
    expect(classes).toContain('px-2.5')
    expect(classes).toContain('py-0.5')
    expect(classes).toContain('text-xs')
    expect(classes).toContain('font-semibold')
  })
})
