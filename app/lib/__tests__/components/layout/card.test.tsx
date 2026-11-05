import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/app/lib/components/ui/layout/card'

describe('Card Components', () => {
  const _user = userEvent.setup()

  describe('Card', () => {
    it('renders with default props', () => {
      render(<Card>Card content</Card>)
      const card = screen.getByText('Card content')
      expect(card).toBeInTheDocument()
    })

    it('renders with outline variant', () => {
      render(<Card variant="outline">Outline card</Card>)
      const card = screen.getByText('Outline card').parentElement
      expect(card).toBeInTheDocument()
    })

    it('renders with ghost variant', () => {
      render(<Card variant="ghost">Ghost card</Card>)
      const card = screen.getByText('Ghost card').parentElement
      expect(card).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<Card className="custom-class">Custom card</Card>)
      const card = screen.getByText('Custom card')
      expect(card).toBeInTheDocument()
    })
  })

  describe('CardHeader', () => {
    it('renders with default props', () => {
      render(<CardHeader>Header content</CardHeader>)
      const header = screen.getByText('Header content')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-4')
    })

    it('renders with different padding sizes', () => {
      const { rerender } = render(<CardHeader padding="sm">Small padding</CardHeader>)
      expect(screen.getByText('Small padding')).toHaveClass('p-2')

      rerender(<CardHeader padding="lg">Large padding</CardHeader>)
      expect(screen.getByText('Large padding')).toHaveClass('p-6')
    })

    it('applies custom className', () => {
      render(<CardHeader className="custom-header">Custom header</CardHeader>)
      const header = screen.getByText('Custom header')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('renders with default props', () => {
      render(<CardTitle>Card Title</CardTitle>)
      const title = screen.getByRole('heading', { name: 'Card Title' })
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('font-semibold', 'tracking-tight', 'text-lg')
    })

    it('renders with different heading levels', () => {
      render(<CardTitle as="h1">H1 Title</CardTitle>)
      const title = screen.getByRole('heading', { name: 'H1 Title', level: 1 })
      expect(title).toBeInTheDocument()
    })

    it('renders with different sizes', () => {
      const { rerender } = render(<CardTitle size="sm">Small title</CardTitle>)
      expect(screen.getByText('Small title')).toHaveClass('text-sm')

      rerender(<CardTitle size="xl">Extra large title</CardTitle>)
      expect(screen.getByText('Extra large title')).toHaveClass('text-xl')

      rerender(<CardTitle size="2xl">2XL title</CardTitle>)
      expect(screen.getByText('2XL title')).toHaveClass('text-2xl')
    })

    it('applies custom className', () => {
      render(<CardTitle className="custom-title">Custom title</CardTitle>)
      const title = screen.getByText('Custom title')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('CardDescription', () => {
    it('renders with default props', () => {
      render(<CardDescription>Card description</CardDescription>)
      const description = screen.getByText('Card description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })

    it('renders with different elements', () => {
      render(<CardDescription as="span">Span description</CardDescription>)
      const description = screen.getByText('Span description')
      expect(description.tagName).toBe('SPAN')
    })

    it('renders with different sizes', () => {
      const { rerender } = render(<CardDescription size="sm">Small description</CardDescription>)
      expect(screen.getByText('Small description')).toHaveClass('text-xs')

      rerender(<CardDescription size="lg">Large description</CardDescription>)
      expect(screen.getByText('Large description')).toHaveClass('text-base')
    })

    it('renders with different colors', () => {
      const { rerender } = render(<CardDescription color="default">Default color</CardDescription>)
      expect(screen.getByText('Default color')).not.toHaveClass('text-muted-foreground')

      rerender(<CardDescription color="subtle">Subtle color</CardDescription>)
      expect(screen.getByText('Subtle color')).toHaveClass('text-muted-foreground/70')
    })

    it('applies custom className', () => {
      render(<CardDescription className="custom-desc">Custom description</CardDescription>)
      const description = screen.getByText('Custom description')
      expect(description).toHaveClass('custom-desc')
    })
  })

  describe('CardContent', () => {
    it('renders with default props', () => {
      render(<CardContent>Content</CardContent>)
      const content = screen.getByText('Content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('p-4')
    })

    it('renders with different padding sizes', () => {
      const { rerender } = render(<CardContent padding="sm">Small content</CardContent>)
      expect(screen.getByText('Small content')).toHaveClass('p-2')

      rerender(<CardContent padding="lg">Large content</CardContent>)
      expect(screen.getByText('Large content')).toHaveClass('p-6')
    })

    it('adjusts padding when hasHeader is true', () => {
      render(<CardContent hasHeader>Content with header</CardContent>)
      const content = screen.getByText('Content with header')
      expect(content).toHaveClass('pt-0')
    })

    it('applies custom className', () => {
      render(<CardContent className="custom-content">Custom content</CardContent>)
      const content = screen.getByText('Custom content')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('CardFooter', () => {
    it('renders with default props', () => {
      render(<CardFooter>Footer content</CardFooter>)
      const footer = screen.getByText('Footer content')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveClass('flex', 'items-center', 'p-4', 'justify-start')
    })

    it('renders with different padding sizes', () => {
      const { rerender } = render(<CardFooter padding="sm">Small footer</CardFooter>)
      expect(screen.getByText('Small footer')).toHaveClass('p-2')

      rerender(<CardFooter padding="lg">Large footer</CardFooter>)
      expect(screen.getByText('Large footer')).toHaveClass('p-6')
    })

    it('adjusts padding when hasContent is true', () => {
      render(<CardFooter hasContent>Footer with content</CardFooter>)
      const footer = screen.getByText('Footer with content')
      expect(footer).toHaveClass('pt-0')
    })

    it('renders with different alignments', () => {
      const { rerender } = render(<CardFooter align="center">Center footer</CardFooter>)
      expect(screen.getByText('Center footer')).toHaveClass('justify-center')

      rerender(<CardFooter align="right">Right footer</CardFooter>)
      expect(screen.getByText('Right footer')).toHaveClass('justify-end')

      rerender(<CardFooter align="between">Between footer</CardFooter>)
      expect(screen.getByText('Between footer')).toHaveClass('justify-between')
    })

    it('applies custom className', () => {
      render(<CardFooter className="custom-footer">Custom footer</CardFooter>)
      const footer = screen.getByText('Custom footer')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('Card Composition', () => {
    it('renders a complete card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test description</CardDescription>
          </CardHeader>
          <CardContent hasHeader>
            <p>Test content</p>
          </CardContent>
          <CardFooter hasContent>
            <button>Test action</button>
          </CardFooter>
        </Card>,
      )

      expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
      expect(screen.getByText('Test content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Test action' })).toBeInTheDocument()
    })

    it('handles complex card layouts', () => {
      render(
        <Card variant="outline" padding="lg">
          <CardHeader padding="lg">
            <CardTitle size="xl" as="h2">
              Large Title
            </CardTitle>
            <CardDescription size="lg" color="subtle">
              Large description
            </CardDescription>
          </CardHeader>
          <CardContent hasHeader padding="lg">
            <div>Complex content</div>
          </CardContent>
          <CardFooter hasContent padding="lg" align="between">
            <button>Cancel</button>
            <button>Save</button>
          </CardFooter>
        </Card>,
      )

      const card = screen.getByText('Large Title').closest('div')?.parentElement
      expect(card).toHaveClass('border-border/50')

      expect(screen.getByText('Large Title')).toHaveClass('text-xl')
      expect(screen.getByText('Large description')).toHaveClass(
        'text-base',
        'text-muted-foreground/70',
      )
      expect(screen.getByText('Complex content').parentElement).toHaveClass('p-6', 'pt-4')
      expect(screen.getByText('Cancel').parentElement).toHaveClass('justify-between', 'p-6', 'pt-4')
    })
  })

  describe('Card Accessibility', () => {
    it('supports proper heading hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle as="h1">Main Title</CardTitle>
            <CardTitle as="h2">Sub Title</CardTitle>
          </CardHeader>
        </Card>,
      )

      expect(screen.getByRole('heading', { name: 'Main Title', level: 1 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Sub Title', level: 2 })).toBeInTheDocument()
    })

    it('forwards refs correctly', () => {
      const ref = jest.fn()
      render(<Card ref={ref}>Ref card</Card>)
      expect(ref).toHaveBeenCalled()
    })
  })
})
