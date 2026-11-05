import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveTextContent(text: string | RegExp): R
      toHaveClass(...classNames: string[]): R
      toHaveAttribute(attr: string, value?: string): R
      toBeVisible(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toBeRequired(): R
      toBeValid(): R
      toBeInvalid(): R
      toHaveValue(value: string | string[] | number): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toBeChecked(): R
      toHaveFocus(): R
      toHaveFormValues(expectedValues: Record<string, unknown>): R
      toHaveStyle(css: string | Record<string, string | number>): R
      toHaveAccessibleName(name: string | RegExp): R
      toHaveAccessibleDescription(description: string | RegExp): R
      toHaveRole(role: string, options?: Record<string, unknown>): R
      toBeEmptyDOMElement(): R
      toHaveErrorMessage(text: string | RegExp): R
      toBePartiallyChecked(): R
    }
  }

  // Extend global types for testing
  var global: {
    setTimeout: typeof setTimeout
    clearTimeout: typeof clearTimeout
    setInterval: typeof setInterval
    clearInterval: typeof clearInterval
  }

  // Extend window types for testing
  interface Window {
    matchMedia: (query: string) => MediaQueryList
  }
}

export {}
