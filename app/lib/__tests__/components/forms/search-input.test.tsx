import { render, screen, fireEvent } from '@testing-library/react'
import { SearchInput } from '@/app/lib/components/ui/forms/search-input'

// Mock the utils to avoid issues with window.location
jest.mock('../../../utils/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

describe('SearchInput', () => {
  it('renders with default placeholder', () => {
    render(<SearchInput />)

    const input = screen.getByPlaceholderText('Search...')
    expect(input).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(<SearchInput placeholder="Custom placeholder" />)

    const input = screen.getByPlaceholderText('Custom placeholder')
    expect(input).toBeInTheDocument()
  })

  it('handles value and onChange', () => {
    const mockOnChange = jest.fn()
    render(<SearchInput value="test value" onChange={mockOnChange} />)

    const input = screen.getByDisplayValue('test value')
    expect(input).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'new value' } })
    expect(mockOnChange).toHaveBeenCalled()
  })

  it('applies custom className to input', () => {
    const { container } = render(<SearchInput className="custom-input-class" />)

    const input = container.querySelector('input')
    expect(input).toHaveClass('custom-input-class')
  })

  it('applies custom containerClassName', () => {
    const { container } = render(<SearchInput containerClassName="custom-container-class" />)

    const containerDiv = container.firstChild as HTMLElement
    expect(containerDiv).toHaveClass('custom-container-class')
  })

  it('applies custom iconClassName', () => {
    const { container } = render(<SearchInput iconClassName="custom-icon-class" />)

    const icon = container.querySelector('svg')
    expect(icon).toHaveClass('custom-icon-class')
  })

  it('forwards additional props to input', () => {
    render(<SearchInput data-testid="search-input" disabled />)

    const input = screen.getByTestId('search-input')
    expect(input).toBeDisabled()
  })

  it('renders search icon', () => {
    const { container } = render(<SearchInput />)

    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })
})
