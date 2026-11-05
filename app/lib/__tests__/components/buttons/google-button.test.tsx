import { render, screen, fireEvent } from '@testing-library/react'
import { GoogleButton } from '@/app/lib/components/ui/buttons/google-button'

describe('GoogleButton', () => {
  it('renders with default text', () => {
    render(<GoogleButton />)
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<GoogleButton>Sign in with Google</GoogleButton>)
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<GoogleButton isLoading>Custom Text</GoogleButton>)
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(screen.queryByText('Custom Text')).not.toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<GoogleButton onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading', () => {
    render(<GoogleButton isLoading />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('has Google logo when not loading', () => {
    render(<GoogleButton />)
    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('does not show Google logo when loading', () => {
    render(<GoogleButton isLoading />)
    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<GoogleButton className="custom-class" />)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })
})
