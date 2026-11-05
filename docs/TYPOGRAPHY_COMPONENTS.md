# Typography Components

This document describes the typography components available in the Eddo Workspace application. These components provide consistent text styling across the application and reduce the need for repetitive className usage.

## File Structure

The typography components are organized in a dedicated folder to avoid barrel files and improve maintainability:

```
app/v2/shared/components/typography/
├── index.ts              # Main exports
├── heading.tsx           # Base Heading component
├── text.tsx              # Base Text component
├── label.tsx             # Label component
├── h1.tsx               # H1 component
├── h2.tsx               # H2 component
├── h3.tsx               # H3 component
├── h4.tsx               # H4 component
├── h5.tsx               # H5 component
├── h6.tsx               # H6 component
├── p.tsx                # P component
├── span.tsx             # Span component
├── muted-text.tsx       # MutedText component
├── small-text.tsx       # SmallText component
├── caption.tsx          # Caption component
├── lead.tsx             # Lead component
└── demo.tsx             # Demo component
```

## Overview

The typography system is built using `class-variance-authority` (CVA) to provide flexible, type-safe styling options. All components support custom className props for additional styling when needed.

## Components

### Heading Components

#### H1 - H6

Specific heading components with predefined sizes and weights.

```tsx
import { H1, H2, H3, H4, H5, H6 } from '@/app/v2/shared/components/typography'

// Usage
<H1>Main Title</H1>
<H2>Section Title</H2>
<H3>Subsection Title</H3>
<H4>Card Title</H4>
<H5>Small Title</H5>
<H6>Smallest Title</H6>
```

**Fixed Sizes:**

- H1: `text-4xl`
- H2: `text-3xl`
- H3: `text-2xl`
- H4: `text-xl`
- H5: `text-lg`
- H6: `text-base`

**Props:**

- `weight`: 'normal' | 'medium' | 'semibold' | 'bold'
- `className`: Additional CSS classes

#### Generic Heading

Flexible heading component that allows custom element types.

```tsx
import { Heading } from '@/app/v2/shared/components/typography'

// Usage
;<Heading as="h1" size="2xl" weight="semibold">
  Custom Heading
</Heading>
```

### Text Components

#### P (Paragraph)

Standard paragraph component with compound variants for common use cases.

```tsx
import { P } from '@/app/v2/shared/components/typography'

// Basic usage
<P>This is a paragraph of text.</P>

// Compound components for common variants
<P.Muted>This text appears muted</P.Muted>
<P.Small>This is small text</P.Small>
<P.SmallMuted>Small muted text</P.SmallMuted>
<P.Large>Large paragraph text</P.Large>

// Custom styling (still available)
<P size="lg" weight="medium" color="primary">
  Custom styled paragraph
</P>
```

#### Span

Inline text component.

```tsx
import { Span } from '@/app/v2/shared/components/typography'

// Usage
<Span>Inline text</Span>
<Span size="sm" color="muted">Small muted text</Span>
```

#### Generic Text

Flexible text component that allows custom element types.

```tsx
import { Text } from '@/app/v2/shared/components/typography'

// Usage
;<Text as="div" size="lg" color="primary">
  Custom text element
</Text>
```

**Props:**

- `size`: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
- `weight`: 'normal' | 'medium' | 'semibold' | 'bold'
- `color`: 'default' | 'muted' | 'primary' | 'destructive' | 'success' | 'warning' | 'info'
- `as`: 'p' | 'span' | 'div'
- `className`: Additional CSS classes

### Utility Components

#### MutedText

Pre-styled paragraph with muted color.

```tsx
import { MutedText } from '@/app/v2/shared/components/typography'

// Usage
;<MutedText>This text appears muted</MutedText>
```

#### SmallText

Pre-styled paragraph with small size.

```tsx
import { SmallText } from '@/app/v2/shared/components/typography'

// Usage
<SmallText>This is small text</SmallText>
<SmallText color="muted">Small muted text</SmallText>
```

#### Caption

Pre-styled paragraph with extra small size and muted color.

```tsx
import { Caption } from '@/app/v2/shared/components/typography'

// Usage
;<Caption>This is caption text</Caption>
```

#### Lead

Pre-styled paragraph with large size.

```tsx
import { Lead } from '@/app/v2/shared/components/typography'

// Usage
;<Lead>This is lead text</Lead>
```

## Color Variants

The typography components support several color variants:

- `default`: `text-foreground` (default text color)
- `muted`: `text-muted-foreground` (secondary text color)
- `primary`: `text-primary` (brand color)
- `destructive`: `text-destructive` (error color)
- `success`: `text-green-600 dark:text-green-400` (success color)
- `warning`: `text-yellow-600 dark:text-yellow-400` (warning color)
- `info`: `text-blue-600 dark:text-blue-400` (info color)

## Size Variants

Available size variants for text components:

- `xs`: `text-xs` (12px)
- `sm`: `text-sm` (14px)
- `base`: `text-base` (16px)
- `lg`: `text-lg` (18px)
- `xl`: `text-xl` (20px)
- `2xl`: `text-2xl` (24px)
- `3xl`: `text-3xl` (30px)
- `4xl`: `text-4xl` (36px)

## Weight Variants

Available weight variants:

- `normal`: `font-normal` (400)
- `medium`: `font-medium` (500)
- `semibold`: `font-semibold` (600)
- `bold`: `font-bold` (700)

## Compound Components

Some components provide compound variants for common use cases, making the API more intuitive and reducing the need for repetitive props.

### P Component Variants

```tsx
import { P } from '@/app/v2/shared/components/typography'

// Instead of writing this:
<P size="sm" color="muted">Small muted text</P>

// You can write this:
<P.SmallMuted>Small muted text</P.SmallMuted>
```

**Available P Variants:**

- `P.Muted` - Muted color text
- `P.Small` - Small size text
- `P.SmallMuted` - Small size with muted color
- `P.Large` - Large size text

## Usage Examples

### Basic Usage

```tsx
import { H1, P, Caption } from '@/app/v2/shared/components/typography'

function MyComponent() {
  return (
    <div>
      <H1>Welcome to Eddo Workspace</H1>
      <P>This is the main content area.</P>
      <P.SmallMuted>Additional information</P.SmallMuted>
      <Caption>Last updated: 2024-01-15</Caption>
    </div>
  )
}
```

### Custom Styling

```tsx
import { H2, P, SmallText } from '@/app/v2/shared/components/typography'

function AssessmentCard({ title, description, status }) {
  return (
    <div className="p-4 border rounded-lg">
      <H2 size="lg" weight="semibold">
        {title}
      </H2>
      <P size="sm" color="muted">
        {description}
      </P>
      <SmallText color="success">{status}</SmallText>
    </div>
  )
}
```

### Responsive Design

```tsx
import { H1, P } from '@/app/v2/shared/components/typography'

function PageHeader({ title, subtitle }) {
  return (
    <div>
      <H1 className="text-2xl md:text-4xl">{title}</H1>
      <P className="text-sm md:text-base">{subtitle}</P>
    </div>
  )
}
```

### Form Labels

```tsx
import { P, Caption } from '@/app/v2/shared/components/typography'

function FormField({ label, description, children }) {
  return (
    <div>
      <P weight="medium" size="sm">
        {label}
      </P>
      {description && <Caption>{description}</Caption>}
      {children}
    </div>
  )
}
```

## Migration Guide

### Before (with className)

```tsx
// Old way
<h1 className="text-3xl font-bold">Title</h1>
<p className="text-sm text-muted-foreground">Description</p>
<span className="text-xs text-muted-foreground">Caption</span>
```

### After (with typography components)

```tsx
// New way
import { H1, P, Caption } from '@/app/v2/shared/components/typography'

<H1>Title</H1>
<P.SmallMuted>Description</P.SmallMuted>
<Caption>Caption</Caption>
```

## Benefits

1. **Consistency**: Ensures consistent typography across the application
2. **Maintainability**: Centralized styling makes updates easier
3. **Type Safety**: TypeScript support for all props
4. **Flexibility**: Custom className support for edge cases
5. **Performance**: Optimized CSS classes
6. **Accessibility**: Proper semantic HTML elements

## Best Practices

1. **Use semantic components**: Prefer H1-H6 over generic Heading when possible
2. **Consistent sizing**: Use the predefined size variants rather than custom classes
3. **Color hierarchy**: Use muted colors for secondary information
4. **Responsive design**: Combine with responsive classes when needed
5. **Accessibility**: Ensure proper heading hierarchy (H1 → H2 → H3)

## Testing

All typography components include comprehensive tests covering:

- Default rendering
- Custom props
- Color variants
- Size variants
- Weight variants
- Custom className support
- Ref forwarding

Run tests with:

```bash
npm test -- typography.test.tsx
```
