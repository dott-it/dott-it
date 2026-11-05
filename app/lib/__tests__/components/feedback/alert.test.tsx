import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Alert,
  AlertTitle,
  AlertDescription,
  alertVariants,
} from '@/app/lib/components/ui/feedback/alert'

describe('Alert', () => {
  it('renders with default props', () => {
    render(<Alert>Default Alert</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg', 'border', 'p-4')
  })

  it('renders with different variants', () => {
    const { rerender } = render(<Alert variant="default">Default Alert</Alert>)
    expect(screen.getByRole('alert')).toHaveClass('bg-background', 'text-foreground')

    rerender(<Alert variant="destructive">Destructive Alert</Alert>)
    expect(screen.getByRole('alert')).toHaveClass('border-destructive/50', 'text-destructive')
  })

  it('applies custom className', () => {
    render(<Alert className="custom-alert">Custom Alert</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('custom-alert')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Alert ref={ref}>Ref Alert</Alert>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('applies all HTML attributes', () => {
    render(
      <Alert data-testid="alert" aria-label="Important alert">
        Accessible Alert
      </Alert>,
    )
    const alert = screen.getByTestId('alert')
    expect(alert).toHaveAttribute('aria-label', 'Important alert')
  })

  it('renders with icon and content', () => {
    render(
      <Alert>
        <svg data-testid="icon" />
        <div>Alert content</div>
      </Alert>,
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('Alert content')).toBeInTheDocument()
  })
})

describe('AlertTitle', () => {
  it('renders with default props', () => {
    render(<AlertTitle>Alert Title</AlertTitle>)
    const title = screen.getByText('Alert Title')
    expect(title).toBeInTheDocument()
    expect(title.tagName).toBe('H5')
    expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight')
  })

  it('applies custom className', () => {
    render(<AlertTitle className="custom-title">Custom Title</AlertTitle>)
    const title = screen.getByText('Custom Title')
    expect(title).toHaveClass('custom-title')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLHeadingElement>()
    render(<AlertTitle ref={ref}>Ref Title</AlertTitle>)
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement)
  })

  it('applies all HTML attributes', () => {
    render(
      <AlertTitle data-testid="title" aria-label="Alert title">
        Accessible Title
      </AlertTitle>,
    )
    const title = screen.getByTestId('title')
    expect(title).toHaveAttribute('aria-label', 'Alert title')
  })
})

describe('AlertDescription', () => {
  it('renders with default props', () => {
    render(<AlertDescription>Alert Description</AlertDescription>)
    const description = screen.getByText('Alert Description')
    expect(description).toBeInTheDocument()
    expect(description.tagName).toBe('DIV')
    expect(description).toHaveClass('text-sm')
  })

  it('applies custom className', () => {
    render(<AlertDescription className="custom-description">Custom Description</AlertDescription>)
    const description = screen.getByText('Custom Description')
    expect(description).toHaveClass('custom-description')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<AlertDescription ref={ref}>Ref Description</AlertDescription>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('applies all HTML attributes', () => {
    render(
      <AlertDescription data-testid="description" aria-label="Alert description">
        Accessible Description
      </AlertDescription>,
    )
    const description = screen.getByTestId('description')
    expect(description).toHaveAttribute('aria-label', 'Alert description')
  })
})

describe('Alert Composition', () => {
  it('renders complete alert with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Important Notice</AlertTitle>
        <AlertDescription>This is an important message for all users.</AlertDescription>
      </Alert>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Important Notice')).toBeInTheDocument()
    expect(screen.getByText('This is an important message for all users.')).toBeInTheDocument()
  })

  it('renders destructive alert with title and description', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong. Please try again.</AlertDescription>
      </Alert>,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('border-destructive/50', 'text-destructive')
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })
})

describe('alertVariants', () => {
  it('generates correct classes for default variant', () => {
    const classes = alertVariants({ variant: 'default' })
    expect(classes).toContain('bg-background')
    expect(classes).toContain('text-foreground')
  })

  it('generates correct classes for destructive variant', () => {
    const classes = alertVariants({ variant: 'destructive' })
    expect(classes).toContain('border-destructive/50')
    expect(classes).toContain('text-destructive')
  })

  it('includes base classes for all variants', () => {
    const classes = alertVariants({ variant: 'default' })
    expect(classes).toContain('relative')
    expect(classes).toContain('w-full')
    expect(classes).toContain('rounded-lg')
    expect(classes).toContain('border')
    expect(classes).toContain('p-4')
  })
})
