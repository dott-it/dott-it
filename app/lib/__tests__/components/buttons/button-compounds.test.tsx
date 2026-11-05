import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'

describe('Button Compound Components', () => {
  const user = userEvent.setup()

  describe('Base Button', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('handles click events', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)

      const button = screen.getByRole('button', { name: 'Click me' })
      await user.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('supports keyboard navigation', async () => {
      render(<Button>Accessible Button</Button>)
      const button = screen.getByRole('button', { name: 'Accessible Button' })

      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(button).toHaveFocus()
    })
  })

  describe('Button with URLs', () => {
    it('renders as internal link when href is provided', () => {
      render(<Button href="/dashboard">Go to Dashboard</Button>)
      const link = screen.getByRole('link', { name: 'Go to Dashboard' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/dashboard')
    })

    it('renders as external link when href and external are provided', () => {
      render(
        <Button href="https://example.com" external>
          External Link
        </Button>,
      )
      const link = screen.getByRole('link', { name: 'External Link' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('applies button styles to links', () => {
      render(<Button href="/dashboard">Styled Link</Button>)
      const link = screen.getByRole('link', { name: 'Styled Link' })
      expect(link).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('handles click events on links', async () => {
      const handleClick = jest.fn()
      render(
        <Button href="/dashboard" onClick={handleClick}>
          Clickable Link
        </Button>,
      )

      const link = screen.getByRole('link', { name: 'Clickable Link' })
      await user.click(link)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('allows preventing default link behavior', async () => {
      const handleClick = jest.fn((e) => e.preventDefault())
      render(
        <Button href="/dashboard" onClick={handleClick}>
          Prevented Link
        </Button>,
      )

      const link = screen.getByRole('link', { name: 'Prevented Link' })
      await user.click(link)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Variant Components', () => {
    it('renders Primary variant', () => {
      render(<Button.Primary>Primary Button</Button.Primary>)
      const button = screen.getByRole('button', { name: 'Primary Button' })
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('renders Secondary variant', () => {
      render(<Button.Secondary>Secondary Button</Button.Secondary>)
      const button = screen.getByRole('button', { name: 'Secondary Button' })
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('renders Outline variant', () => {
      render(<Button.Outline>Outline Button</Button.Outline>)
      const button = screen.getByRole('button', { name: 'Outline Button' })
      expect(button).toHaveClass('border', 'border-input', 'bg-background')
    })

    it('renders Ghost variant', () => {
      render(<Button.Ghost>Ghost Button</Button.Ghost>)
      const button = screen.getByRole('button', { name: 'Ghost Button' })
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
    })

    it('renders Destructive variant', () => {
      render(<Button.Destructive>Destructive Button</Button.Destructive>)
      const button = screen.getByRole('button', { name: 'Destructive Button' })
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('renders Link variant', () => {
      render(<Button.Link>Link Button</Button.Link>)
      const button = screen.getByRole('button', { name: 'Link Button' })
      expect(button).toHaveClass('text-primary', 'underline-offset-4')
    })
  })

  describe('Size Components', () => {
    it('renders Small size', () => {
      render(<Button.Small>Small Button</Button.Small>)
      const button = screen.getByRole('button', { name: 'Small Button' })
      expect(button).toHaveClass('h-9', 'rounded-md', 'px-3')
    })

    it('renders Large size', () => {
      render(<Button.Large>Large Button</Button.Large>)
      const button = screen.getByRole('button', { name: 'Large Button' })
      expect(button).toHaveClass('h-11', 'rounded-md', 'px-8')
    })

    it('renders Icon size', () => {
      render(<Button.Icon>Icon Button</Button.Icon>)
      const button = screen.getByRole('button', { name: 'Icon Button' })
      expect(button).toHaveClass('size-10')
    })
  })

  describe('Combination Components', () => {
    it('renders PrimarySmall combination', () => {
      render(<Button.PrimarySmall>Primary Small</Button.PrimarySmall>)
      const button = screen.getByRole('button', { name: 'Primary Small' })
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'h-9', 'px-3')
    })

    it('renders PrimaryLarge combination', () => {
      render(<Button.PrimaryLarge>Primary Large</Button.PrimaryLarge>)
      const button = screen.getByRole('button', { name: 'Primary Large' })
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'h-11', 'px-8')
    })

    it('renders OutlineSmall combination', () => {
      render(<Button.OutlineSmall>Outline Small</Button.OutlineSmall>)
      const button = screen.getByRole('button', { name: 'Outline Small' })
      expect(button).toHaveClass('border', 'border-input', 'bg-background', 'h-9', 'px-3')
    })

    it('renders OutlineLarge combination', () => {
      render(<Button.OutlineLarge>Outline Large</Button.OutlineLarge>)
      const button = screen.getByRole('button', { name: 'Outline Large' })
      expect(button).toHaveClass('border', 'border-input', 'bg-background', 'h-11', 'px-8')
    })
  })

  describe('Action Components', () => {
    it('renders Action button with full width', () => {
      render(<Button.Action>Action Button</Button.Action>)
      const button = screen.getByRole('button', { name: 'Action Button' })
      expect(button).toHaveClass('w-full')
    })

    it('renders ActionSmall button', () => {
      render(<Button.ActionSmall>Small Action</Button.ActionSmall>)
      const button = screen.getByRole('button', { name: 'Small Action' })
      expect(button).toHaveClass('w-full', 'h-9', 'px-3')
    })
  })

  describe('Navigation Components', () => {
    it('renders Nav button with left alignment', () => {
      render(<Button.Nav>Navigation Button</Button.Nav>)
      const button = screen.getByRole('button', { name: 'Navigation Button' })
      expect(button).toHaveClass('w-full', 'justify-start')
    })

    it('renders NavSmall button', () => {
      render(<Button.NavSmall>Small Navigation</Button.NavSmall>)
      const button = screen.getByRole('button', { name: 'Small Navigation' })
      expect(button).toHaveClass('w-full', 'justify-start', 'h-9', 'px-3')
    })
  })

  describe('Form Components', () => {
    it('renders Submit button with submit type', () => {
      render(<Button.Submit>Submit</Button.Submit>)
      const button = screen.getByRole('button', { name: 'Submit' })
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('renders SubmitWithLoading button with submit type', () => {
      render(<Button.SubmitWithLoading>Submit</Button.SubmitWithLoading>)
      const button = screen.getByRole('button', { name: 'Submit' })
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('renders SubmitWithLoading in loading state', () => {
      render(
        <Button.SubmitWithLoading isLoading={true} loadingText="Processing...">
          Submit
        </Button.SubmitWithLoading>,
      )
      const button = screen.getByRole('button', { name: 'Processing...' })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Processing...')
    })

    it('renders SubmitWithLoading with default loading text', () => {
      render(<Button.SubmitWithLoading isLoading={true}>Submit</Button.SubmitWithLoading>)
      const button = screen.getByRole('button', { name: 'Loading...' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Loading...')
    })

    it('renders SubmitWithLoading with custom loading text', () => {
      render(
        <Button.SubmitWithLoading isLoading={true} loadingText="Saving...">
          Save
        </Button.SubmitWithLoading>,
      )
      const button = screen.getByRole('button', { name: 'Saving...' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Saving...')
    })

    it('renders SubmitWithLoading in normal state with arrow icon', () => {
      render(<Button.SubmitWithLoading>Submit</Button.SubmitWithLoading>)
      const button = screen.getByRole('button', { name: 'Submit' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Submit')
      expect(button).not.toBeDisabled()
    })

    it('renders Cancel button with button type', () => {
      render(<Button.Cancel>Cancel</Button.Cancel>)
      const button = screen.getByRole('button', { name: 'Cancel' })
      expect(button).toHaveAttribute('type', 'button')
    })
  })

  describe('Compound Components with URLs', () => {
    it('renders PrimarySmall with internal link', () => {
      render(<Button.PrimarySmall href="/quick-action">Quick Action</Button.PrimarySmall>)
      const link = screen.getByRole('link', { name: 'Quick Action' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/quick-action')
      expect(link).toHaveClass('bg-primary', 'text-primary-foreground', 'h-9', 'px-3')
    })

    it('renders OutlineLarge with external link', () => {
      render(
        <Button.OutlineLarge href="https://example.com" external>
          External Large
        </Button.OutlineLarge>,
      )
      const link = screen.getByRole('link', { name: 'External Large' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveClass('border', 'border-input', 'bg-background', 'h-11', 'px-8')
    })

    it('renders Action with link', () => {
      render(<Button.Action href="/main-action">Main Action</Button.Action>)
      const link = screen.getByRole('link', { name: 'Main Action' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/main-action')
      expect(link).toHaveClass('w-full')
    })

    it('renders Nav with link', () => {
      render(<Button.Nav href="/navigation">Navigation Link</Button.Nav>)
      const link = screen.getByRole('link', { name: 'Navigation Link' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/navigation')
      expect(link).toHaveClass('w-full', 'justify-start')
    })
  })
})
