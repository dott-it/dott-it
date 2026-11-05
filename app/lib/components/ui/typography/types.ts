export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'subtitle1'
  | 'subtitle2'
  | 'body1'
  | 'body2'
  | 'button'
  | 'caption'
  | 'overline'
  | 'inherit'

export type TypographyColor =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'light'
  | 'dark'
  | 'text'
  | 'white'

export type TypographyFontWeight = 'false' | 'light' | 'regular' | 'medium' | 'bold'

export type TypographyTextTransform = 'none' | 'capitalize' | 'uppercase' | 'lowercase'

export type TypographyVerticalAlign =
  | 'unset'
  | 'baseline'
  | 'sub'
  | 'super'
  | 'text-top'
  | 'text-bottom'
  | 'middle'
  | 'top'
  | 'bottom'

export type TypographyOpacity = 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1

export type TypographyComponent =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'caption'

// Utility type for creating custom variants
export interface TypographyVariantConfig {
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing?: string
}

// Theme configuration type
export interface TypographyTheme {
  variants: Record<TypographyVariant, TypographyVariantConfig>
  colors: Record<TypographyColor, string>
  fontWeights: Record<TypographyFontWeight, string>
}
