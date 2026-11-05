import { getButtonComponent } from '../../../../components/ui/layout/header/button-variant-map'

// Mock the Button components
jest.mock('../../../../components/ui/buttons/button-compounds', () => ({
  Button: {
    Action: 'Button.Action',
    Secondary: 'Button.Secondary',
    Outline: 'Button.Outline',
    Ghost: 'Button.Ghost',
  },
}))

describe('getButtonComponent', () => {
  it('returns Button.Action for primary variant', () => {
    const component = getButtonComponent('primary')
    expect(component).toBe('Button.Action')
  })

  it('returns Button.Secondary for secondary variant', () => {
    const component = getButtonComponent('secondary')
    expect(component).toBe('Button.Secondary')
  })

  it('returns Button.Outline for outline variant', () => {
    const component = getButtonComponent('outline')
    expect(component).toBe('Button.Outline')
  })

  it('returns Button.Ghost for ghost variant', () => {
    const component = getButtonComponent('ghost')
    expect(component).toBe('Button.Ghost')
  })

  it('returns Button.Action as fallback for unknown variant', () => {
    // @ts-expect-error - testing invalid variant
    const component = getButtonComponent('unknown')
    expect(component).toBe('Button.Action')
  })
})
