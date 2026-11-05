# Typography Component

A unified typography component providing a comprehensive set of typography variants and styling options without external dependencies.

## Features

- **Unified API**: Single component for all typography needs
- **Material Design Variants**: All standard Material Design typography variants
- **Flexible Styling**: Extensive customization options
- **TypeScript Support**: Full type safety
- **No External Dependencies**: Built with Tailwind CSS and class-variance-authority

## Basic Usage

```tsx
import { Typography } from '@/app/v2/shared/components/ui/typography'

// Basic variants
<Typography variant="h1">Heading 1</Typography>
<Typography variant="h2">Heading 2</Typography>
<Typography variant="h3">Heading 3</Typography>
<Typography variant="h4">Heading 4</Typography>
<Typography variant="h5">Heading 5</Typography>
<Typography variant="h6">Heading 6</Typography>
<Typography variant="subtitle1">Subtitle 1</Typography>
<Typography variant="subtitle2">Subtitle 2</Typography>
<Typography variant="body1">Body 1</Typography>
<Typography variant="body2">Body 2</Typography>
<Typography variant="button">Button</Typography>
<Typography variant="caption">Caption</Typography>
<Typography variant="overline">Overline</Typography>
<Typography variant="inherit">Inherit</Typography>
```

## Props

### variant

The typography variant to use.

```tsx
type Variant =
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
```

### color

The text color variant.

```tsx
type Color =
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
```

### fontWeight

The font weight to apply.

```tsx
type FontWeight = 'false' | 'light' | 'regular' | 'medium' | 'bold'
```

### textTransform

How to transform the text.

```tsx
type TextTransform = 'none' | 'capitalize' | 'uppercase' | 'lowercase'
```

### verticalAlign

Vertical alignment of the text.

```tsx
type VerticalAlign =
  | 'unset'
  | 'baseline'
  | 'sub'
  | 'super'
  | 'text-top'
  | 'text-bottom'
  | 'middle'
  | 'top'
  | 'bottom'
```

### textGradient

Whether to apply gradient text effect.

```tsx
type TextGradient = boolean
```

### opacity

The opacity level (0.1 to 1).

```tsx
type Opacity = 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1
```

### component

Override the HTML element rendered.

```tsx
type Component =
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
```

## Examples

### Basic Styling

```tsx
// Simple heading
<Typography variant="h1">Page Title</Typography>

// Colored text
<Typography variant="body1" color="primary">
  Important information
</Typography>

// Custom weight
<Typography variant="body1" fontWeight="bold">
  Bold text
</Typography>
```

### Advanced Styling

```tsx
// Gradient text
<Typography variant="h2" textGradient>
  Beautiful Gradient Title
</Typography>

// Transformed text
<Typography variant="button" textTransform="uppercase">
  Click me
</Typography>

// Custom opacity
<Typography variant="body2" opacity={0.7}>
  Muted text
</Typography>
```

### Component Override

```tsx
// Render body1 variant as h1 element
<Typography variant="body1" component="h1">
  Large body text
</Typography>

// Render h1 variant as span
<Typography variant="h1" component="span">
  Inline heading
</Typography>
```

### Complex Examples

```tsx
// Success message
<Typography
  variant="body1"
  color="success"
  fontWeight="medium"
  opacity={0.8}
>
  Operation completed successfully!
</Typography>

// Warning caption
<Typography
  variant="caption"
  color="warning"
  textTransform="capitalize"
>
  please review your input
</Typography>

// Gradient heading with custom styling
<Typography
  variant="h3"
  color="primary"
  fontWeight="bold"
  textTransform="uppercase"
  textGradient
>
  Special Section
</Typography>
```

## Migration from Legacy Components

If you're migrating from the legacy typography components, here's how to replace them:

### Before (Legacy)

```tsx
import { Heading, Text, H1, P } from '@/app/v2/shared/components/ui/typography'

<Heading size="2xl" weight="bold">Title</Heading>
<Text size="lg" color="primary">Content</Text>
<H1>Main Heading</H1>
<P>Paragraph</P>
```

### After (Typography)

```tsx
import { Typography } from '@/app/v2/shared/components/ui/typography'

<Typography variant="h1">Title</Typography>
<Typography variant="body1" color="primary">Content</Typography>
<Typography variant="h1">Main Heading</Typography>
<Typography variant="body1">Paragraph</Typography>
```

## Demo

To see all variants and features in action, use the demo component:

```tsx
import { TypographyDemo } from '@/app/v2/shared/components/ui/typography'
;<TypographyDemo />
```

## Styling Customization

The component uses Tailwind CSS classes and can be customized by:

1. **Extending the variants**: Modify the `mdTypographyVariants` in the component file
2. **Using className prop**: Add custom classes to override or extend styles
3. **CSS Variables**: Use CSS custom properties for theme-specific colors

## Best Practices

1. **Semantic HTML**: The component automatically renders appropriate HTML elements based on the variant
2. **Accessibility**: Use proper heading hierarchy (h1 → h2 → h3, etc.)
3. **Consistency**: Stick to the defined variants for consistent typography across your application
4. **Performance**: The component is optimized with `class-variance-authority` for minimal CSS output
