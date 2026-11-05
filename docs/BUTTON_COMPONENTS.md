# Button Components

This document describes the button components available in the V2 design system, including their variants, sizes, and usage patterns.

## Overview

The button system consists of:
- **Base Button**: A flexible button component that can render as either a button or a link
- **Compound Components**: Pre-configured button variants for common use cases
- **URL Support**: Built-in support for both internal and external links

## Base Button

The base `Button` component supports all standard button props plus URL functionality.

### Basic Usage

```tsx
import { Button } from '@/app/v2/shared/components/ui/buttons/button-compounds'

// Regular button
<Button onClick={handleClick}>Click me</Button>

// Internal link
<Button href="/dashboard">Go to Dashboard</Button>

// External link
<Button href="https://example.com" external>
  External Link
</Button>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive' \| 'link'` | `'default'` | Visual variant of the button |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Size of the button |
| `href` | `string` | - | URL for link behavior (optional) |
| `external` | `boolean` | `false` | Whether the link is external (opens in new tab) |
| `asChild` | `boolean` | `false` | Whether to render as a child component |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `onClick` | `function` | - | Click handler (works for both buttons and links) |

## Compound Components

### Variant Components

```tsx
// Primary button (default variant)
<Button.Primary>Primary Action</Button.Primary>

// Secondary button
<Button.Secondary>Secondary Action</Button.Secondary>

// Outline button
<Button.Outline>Outline Action</Button.Outline>

// Ghost button
<Button.Ghost>Ghost Action</Button.Ghost>

// Destructive button
<Button.Destructive>Delete</Button.Destructive>

// Link-style button
<Button.Link>Link Style</Button.Link>
```

### Size Components

```tsx
// Small button
<Button.Small>Small Button</Button.Small>

// Large button
<Button.Large>Large Button</Button.Large>

// Icon button
<Button.Icon>
  <Settings className="h-4 w-4" />
</Button.Icon>
```

### Combination Components

```tsx
// Primary + Small
<Button.PrimarySmall>Quick Action</Button.PrimarySmall>

// Primary + Large
<Button.PrimaryLarge>Important Action</Button.PrimaryLarge>

// Outline + Small
<Button.OutlineSmall>Secondary Action</Button.OutlineSmall>

// Outline + Large
<Button.OutlineLarge>Prominent Action</Button.OutlineLarge>
```

### Specialized Components

```tsx
// Action buttons (full width)
<Button.Action>Main Action</Button.Action>
<Button.ActionSmall>Small Action</Button.ActionSmall>

// Navigation buttons (left-aligned, full width)
<Button.Nav>
  <ArrowRight className="mr-2 h-4 w-4" />
  Navigate
</Button.Nav>
<Button.NavSmall>
  <Home className="mr-2 h-4 w-4" />
  Home
</Button.NavSmall>

// Form buttons
<Button.Submit>Submit Form</Button.Submit>
<Button.Cancel>Cancel</Button.Cancel>
```

## URL Support

The button component can automatically render as a link when an `href` prop is provided.

### Internal Links

For internal navigation, use the `href` prop without `external`:

```tsx
// Simple internal link
<Button href="/dashboard">Go to Dashboard</Button>

// Internal link with variant
<Button.Primary href="/settings">Settings</Button.Primary>

// Internal link with compound component
<Button.PrimarySmall href="/quick-action">Quick Action</Button.PrimarySmall>

// Navigation link
<Button.Nav href="/workspace">
  <Home className="mr-2 h-4 w-4" />
  Workspace
</Button.Nav>
```

### External Links

For external links, add the `external` prop:

```tsx
// External link (opens in new tab)
<Button href="https://github.com" external>
  GitHub
  <ExternalLink className="ml-2 h-4 w-4" />
</Button>

// External link with variant
<Button.Outline href="https://docs.example.com" external>
  Documentation
  <ExternalLink className="ml-2 h-4 w-4" />
</Button.Outline>

// External link with compound component
<Button.PrimaryLarge href="https://support.example.com" external>
  Get Support
  <ExternalLink className="ml-2 h-4 w-4" />
</Button.PrimaryLarge>
```

### Link with Custom Behavior

You can combine link behavior with custom click handlers:

```tsx
// Link with click handler
<Button 
  href="/dashboard" 
  onClick={(e) => {
    // Custom logic before navigation
    console.log('Navigating to dashboard')
  }}
>
  Go to Dashboard
</Button>

// Prevent default link behavior
<Button 
  href="/dashboard" 
  onClick={(e) => {
    e.preventDefault()
    // Custom navigation logic
    router.push('/custom-route')
  }}
>
  Custom Navigation
</Button>
```

## Migration from V1

### Before (V1)

```tsx
// Regular button
<Button variant="outline" size="sm">
  <FileText className="mr-2" />
  Add Feedback
</Button>

// Link button
<Link href="/dashboard">
  <Button className="w-full justify-start" variant="outline">
    <ArrowRight className="mr-2" />
    Launch V1.0
  </Button>
</Link>

// Form button
<Button type="submit" disabled={isSubmitting}>
  Create Assessment
</Button>
```

### After (V2)

```tsx
// Regular button with compound component
<Button.OutlineSmall>
  <FileText className="mr-2" />
  Add Feedback
</Button.OutlineSmall>

// Link button (no wrapper needed)
<Button.Nav href="/dashboard">
  <ArrowRight className="mr-2" />
  Launch V1.0
</Button.Nav>

// Form button with compound component
<Button.Submit disabled={isSubmitting}>
  Create Assessment
</Button.Submit>
```

## Accessibility Features

- **Keyboard Navigation**: All buttons support keyboard navigation (Enter, Space)
- **Focus Management**: Proper focus indicators and management
- **ARIA Attributes**: Automatic ARIA attributes for proper screen reader support
- **External Link Indicators**: Automatic `target="_blank"` and `rel="noopener noreferrer"` for external links

## Best Practices

1. **Use Compound Components**: Prefer compound components over manual variant/size combinations
2. **Choose Appropriate Variants**: Use semantic variants (e.g., `destructive` for delete actions)
3. **External Link Indicators**: Always include visual indicators (like icons) for external links
4. **Consistent Sizing**: Use consistent button sizes within the same interface
5. **Loading States**: Use the `disabled` prop for loading states
6. **Accessibility**: Ensure button text is descriptive and meaningful

## Examples

### Dashboard Navigation

```tsx
<div className="space-y-4">
  <Button.Action href="/assessments/create">
    <Plus className="mr-2 h-4 w-4" />
    Create Assessment
  </Button.Action>
  
  <Button.Nav href="/assessments">
    <FileText className="mr-2 h-4 w-4" />
    View Assessments
  </Button.Nav>
  
  <Button.Nav href="/settings">
    <Settings className="mr-2 h-4 w-4" />
    Settings
  </Button.Nav>
</div>
```

### Form Actions

```tsx
<div className="flex gap-4">
  <Button.Submit disabled={isSubmitting}>
    {isSubmitting ? 'Saving...' : 'Save Changes'}
  </Button.Submit>
  
  <Button.Cancel onClick={onCancel}>
    Cancel
  </Button.Cancel>
</div>
```

### External Resources

```tsx
<div className="flex gap-4">
  <Button.Outline href="https://docs.example.com" external>
    Documentation
    <ExternalLink className="ml-2 h-4 w-4" />
  </Button.Outline>
  
  <Button.Ghost href="https://support.example.com" external>
    Get Help
    <ExternalLink className="ml-2 h-4 w-4" />
  </Button.Ghost>
</div>
```
