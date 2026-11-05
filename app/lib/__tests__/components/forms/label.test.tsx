import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock Radix UI Label component
jest.mock('@radix-ui/react-label', () => {
  const LabelRoot = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, children, ...props }, ref) => (
      <label ref={ref} className={className} {...props}>
        {children}
      </label>
    ),
  )
  LabelRoot.displayName = 'Label'

  return {
    Root: LabelRoot,
  }
})

import { Label } from '../../../components/ui/forms/label'

describe('Label', () => {
  it('renders with default props', () => {
    render(<Label>Form Label</Label>)
    const label = screen.getByText('Form Label')
    expect(label).toBeInTheDocument()
    expect(label.tagName).toBe('LABEL')
    expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none')
  })

  it('applies custom className', () => {
    render(<Label className="custom-label">Custom Label</Label>)
    const label = screen.getByText('Custom Label')
    expect(label).toHaveClass('custom-label')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLLabelElement>()
    render(<Label ref={ref}>Ref Label</Label>)
    expect(ref.current).toBeInstanceOf(HTMLLabelElement)
  })

  it('applies all HTML attributes', () => {
    render(
      <Label data-testid="label" htmlFor="input-field" aria-label="Form field label">
        Accessible Label
      </Label>,
    )
    const label = screen.getByTestId('label')
    expect(label).toHaveAttribute('for', 'input-field')
    expect(label).toHaveAttribute('aria-label', 'Form field label')
  })

  it('renders with htmlFor attribute', () => {
    render(<Label htmlFor="email-input">Email Address</Label>)
    const label = screen.getByText('Email Address')
    expect(label).toHaveAttribute('for', 'email-input')
  })

  it('has proper peer disabled styles', () => {
    render(<Label>Disabled Peer Label</Label>)
    const label = screen.getByText('Disabled Peer Label')
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70')
  })

  it('renders with complex content', () => {
    render(
      <Label>
        <span>Required</span> Field Label
      </Label>,
    )
    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(screen.getByText('Field Label')).toBeInTheDocument()
  })

  it('works with form elements', () => {
    render(
      <div>
        <Label htmlFor="test-input">Test Input</Label>
        <input id="test-input" data-testid="input" />
      </div>,
    )

    const label = screen.getByText('Test Input')
    const input = screen.getByTestId('input')

    expect(label).toHaveAttribute('for', 'test-input')
    expect(input).toHaveAttribute('id', 'test-input')
  })

  it('applies variant classes correctly', () => {
    render(<Label>Variant Label</Label>)
    const label = screen.getByText('Variant Label')

    // Check base classes
    expect(label).toHaveClass('text-sm')
    expect(label).toHaveClass('font-medium')
    expect(label).toHaveClass('leading-none')
  })
})
