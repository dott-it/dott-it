import React from 'react'
import { render, screen } from '@testing-library/react'
import { Typography } from '@/app/lib/components/ui/typography'

describe('Typography', () => {
  describe('Variants', () => {
    it('renders h1 variant correctly', () => {
      render(<Typography variant="h1">Heading 1</Typography>)
      const element = screen.getByText('Heading 1')
      expect(element.tagName).toBe('H1')
      expect(element).toHaveClass('text-4xl', 'font-bold', 'tracking-tight')
    })

    it('renders h2 variant correctly', () => {
      render(<Typography variant="h2">Heading 2</Typography>)
      const element = screen.getByText('Heading 2')
      expect(element.tagName).toBe('H2')
      expect(element).toHaveClass('text-3xl', 'font-bold', 'tracking-tight')
    })

    it('renders h3 variant correctly', () => {
      render(<Typography variant="h3">Heading 3</Typography>)
      const element = screen.getByText('Heading 3')
      expect(element.tagName).toBe('H3')
      expect(element).toHaveClass('text-2xl', 'font-bold', 'tracking-tight')
    })

    it('renders h4 variant correctly', () => {
      render(<Typography variant="h4">Heading 4</Typography>)
      const element = screen.getByText('Heading 4')
      expect(element.tagName).toBe('H4')
      expect(element).toHaveClass('text-xl', 'font-bold', 'tracking-tight')
    })

    it('renders h5 variant correctly', () => {
      render(<Typography variant="h5">Heading 5</Typography>)
      const element = screen.getByText('Heading 5')
      expect(element.tagName).toBe('H5')
      expect(element).toHaveClass('text-lg', 'font-bold', 'tracking-tight')
    })

    it('renders h6 variant correctly', () => {
      render(<Typography variant="h6">Heading 6</Typography>)
      const element = screen.getByText('Heading 6')
      expect(element.tagName).toBe('H6')
      expect(element).toHaveClass('text-base', 'font-bold', 'tracking-tight')
    })

    it('renders subtitle1 variant correctly', () => {
      render(<Typography variant="subtitle1">Subtitle 1</Typography>)
      const element = screen.getByText('Subtitle 1')
      expect(element.tagName).toBe('P')
      expect(element).toHaveClass('text-lg', 'font-medium', 'leading-relaxed')
    })

    it('renders subtitle2 variant correctly', () => {
      render(<Typography variant="subtitle2">Subtitle 2</Typography>)
      const element = screen.getByText('Subtitle 2')
      expect(element.tagName).toBe('P')
      expect(element).toHaveClass('text-base', 'font-medium', 'leading-relaxed')
    })

    it('renders body1 variant correctly', () => {
      render(<Typography variant="body1">Body 1</Typography>)
      const element = screen.getByText('Body 1')
      expect(element.tagName).toBe('P')
      expect(element).toHaveClass('text-base', 'leading-relaxed')
    })

    it('renders body2 variant correctly', () => {
      render(<Typography variant="body2">Body 2</Typography>)
      const element = screen.getByText('Body 2')
      expect(element.tagName).toBe('P')
      expect(element).toHaveClass('text-sm', 'leading-relaxed')
    })

    it('renders button variant correctly', () => {
      render(<Typography variant="button">Button</Typography>)
      const element = screen.getByText('Button')
      expect(element.tagName).toBe('SPAN')
      expect(element).toHaveClass('text-sm', 'font-medium', 'uppercase', 'tracking-wide')
    })

    it('renders caption variant correctly', () => {
      render(<Typography variant="caption">Caption</Typography>)
      const element = screen.getByText('Caption')
      expect(element.tagName).toBe('SPAN')
      expect(element).toHaveClass('text-xs', 'leading-relaxed')
    })

    it('renders overline variant correctly', () => {
      render(<Typography variant="overline">Overline</Typography>)
      const element = screen.getByText('Overline')
      expect(element.tagName).toBe('SPAN')
      expect(element).toHaveClass('text-xs', 'font-medium', 'uppercase', 'tracking-widest')
    })
  })

  describe('Colors', () => {
    it('applies primary color correctly', () => {
      render(
        <Typography variant="body1" color="primary">
          Primary text
        </Typography>,
      )
      const element = screen.getByText('Primary text')
      expect(element).toHaveClass('text-primary')
    })

    it('applies secondary color correctly', () => {
      render(
        <Typography variant="body1" color="secondary">
          Secondary text
        </Typography>,
      )
      const element = screen.getByText('Secondary text')
      expect(element).toHaveClass('text-secondary')
    })

    it('applies success color correctly', () => {
      render(
        <Typography variant="body1" color="success">
          Success text
        </Typography>,
      )
      const element = screen.getByText('Success text')
      expect(element).toHaveClass('text-green-600', 'dark:text-green-400')
    })

    it('applies error color correctly', () => {
      render(
        <Typography variant="body1" color="error">
          Error text
        </Typography>,
      )
      const element = screen.getByText('Error text')
      expect(element).toHaveClass('text-red-600', 'dark:text-red-400')
    })

    it('applies white color correctly', () => {
      render(
        <Typography variant="body1" color="white">
          White text
        </Typography>,
      )
      const element = screen.getByText('White text')
      expect(element).toHaveClass('text-white')
    })
  })

  describe('Font Weights', () => {
    it('applies light weight correctly', () => {
      render(
        <Typography variant="body1" fontWeight="light">
          Light text
        </Typography>,
      )
      const element = screen.getByText('Light text')
      expect(element).toHaveClass('font-light')
    })

    it('applies regular weight correctly', () => {
      render(
        <Typography variant="body1" fontWeight="regular">
          Regular text
        </Typography>,
      )
      const element = screen.getByText('Regular text')
      expect(element).toHaveClass('font-normal')
    })

    it('applies medium weight correctly', () => {
      render(
        <Typography variant="body1" fontWeight="medium">
          Medium text
        </Typography>,
      )
      const element = screen.getByText('Medium text')
      expect(element).toHaveClass('font-medium')
    })

    it('applies bold weight correctly', () => {
      render(
        <Typography variant="body1" fontWeight="bold">
          Bold text
        </Typography>,
      )
      const element = screen.getByText('Bold text')
      expect(element).toHaveClass('font-bold')
    })
  })

  describe('Text Transform', () => {
    it('applies capitalize transform correctly', () => {
      render(
        <Typography variant="body1" textTransform="capitalize">
          capitalize text
        </Typography>,
      )
      const element = screen.getByText('capitalize text')
      expect(element).toHaveClass('capitalize')
    })

    it('applies uppercase transform correctly', () => {
      render(
        <Typography variant="body1" textTransform="uppercase">
          Uppercase Text
        </Typography>,
      )
      const element = screen.getByText('Uppercase Text')
      expect(element).toHaveClass('uppercase')
    })

    it('applies lowercase transform correctly', () => {
      render(
        <Typography variant="body1" textTransform="lowercase">
          LOWERCASE TEXT
        </Typography>,
      )
      const element = screen.getByText('LOWERCASE TEXT')
      expect(element).toHaveClass('lowercase')
    })
  })

  describe('Gradient Text', () => {
    it('applies gradient text correctly', () => {
      render(
        <Typography variant="h1" textGradient>
          Gradient Text
        </Typography>,
      )
      const element = screen.getByText('Gradient Text')
      expect(element).toHaveClass(
        'bg-gradient-to-r',
        'from-primary',
        'to-secondary',
        'bg-clip-text',
        'text-transparent',
      )
    })
  })

  describe('Opacity', () => {
    it('applies opacity correctly', () => {
      render(
        <Typography variant="body1" opacity={0.8}>
          Opacity text
        </Typography>,
      )
      const element = screen.getByText('Opacity text')
      expect(element).toHaveClass('opacity-80')
    })
  })

  describe('Component Override', () => {
    it('renders with custom component', () => {
      render(
        <Typography variant="body1" component="h1">
          Custom component
        </Typography>,
      )
      const element = screen.getByText('Custom component')
      expect(element.tagName).toBe('H1')
    })

    it('renders h1 variant as span', () => {
      render(
        <Typography variant="h1" component="span">
          H1 as span
        </Typography>,
      )
      const element = screen.getByText('H1 as span')
      expect(element.tagName).toBe('SPAN')
      expect(element).toHaveClass('text-4xl', 'font-bold', 'tracking-tight')
    })
  })

  describe('Default Props', () => {
    it('uses default variant when none specified', () => {
      render(<Typography>Default text</Typography>)
      const element = screen.getByText('Default text')
      expect(element.tagName).toBe('P')
      expect(element).toHaveClass('text-base', 'leading-relaxed')
    })

    it('uses default color when none specified', () => {
      render(<Typography variant="body1">Default color</Typography>)
      const element = screen.getByText('Default color')
      expect(element).toHaveClass('text-gray-900', 'dark:text-gray-100')
    })
  })

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      render(
        <Typography variant="body1" className="custom-class">
          Custom class
        </Typography>,
      )
      const element = screen.getByText('Custom class')
      expect(element).toHaveClass('custom-class')
    })

    it('combines custom className with variant classes', () => {
      render(
        <Typography variant="h1" className="custom-class">
          Combined classes
        </Typography>,
      )
      const element = screen.getByText('Combined classes')
      expect(element).toHaveClass('text-4xl', 'font-bold', 'tracking-tight', 'custom-class')
    })
  })

  describe('Accessibility', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLElement>()
      render(
        <Typography variant="h1" ref={ref}>
          Ref test
        </Typography>,
      )
      expect(ref.current).toBeInTheDocument()
    })

    it('forwards HTML attributes', () => {
      render(
        <Typography variant="body1" data-testid="test-element" id="test-id">
          Attributes test
        </Typography>,
      )
      const element = screen.getByTestId('test-element')
      expect(element).toHaveAttribute('id', 'test-id')
    })
  })
})
