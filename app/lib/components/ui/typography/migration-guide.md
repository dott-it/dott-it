# Migration Guide: Legacy Typography to Typography

This guide helps you migrate from the legacy typography components to the new unified `Typography` component.

## Quick Reference

### Before (Legacy Components)

```tsx
import {
  Heading,
  Text,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  P,
  Span,
  Caption,
} from '@/app/v2/shared/components/ui/typography'
```

### After (Typography)

```tsx
import { Typography } from '@/app/v2/shared/components/ui/typography'
```

## Component Mapping

### Headings

| Legacy                                | Typography                  |
| ------------------------------------- | --------------------------- |
| `<Heading size="4xl" weight="bold">`  | `<Typography variant="h1">` |
| `<Heading size="3xl" weight="bold">`  | `<Typography variant="h2">` |
| `<Heading size="2xl" weight="bold">`  | `<Typography variant="h3">` |
| `<Heading size="xl" weight="bold">`   | `<Typography variant="h4">` |
| `<Heading size="lg" weight="bold">`   | `<Typography variant="h5">` |
| `<Heading size="base" weight="bold">` | `<Typography variant="h6">` |
| `<H1>`                                | `<Typography variant="h1">` |
| `<H2>`                                | `<Typography variant="h2">` |
| `<H3>`                                | `<Typography variant="h3">` |
| `<H4>`                                | `<Typography variant="h4">` |
| `<H5>`                                | `<Typography variant="h5">` |
| `<H6>`                                | `<Typography variant="h6">` |

### Text Components

| Legacy               | Typography                                      |
| -------------------- | ----------------------------------------------- |
| `<Text size="lg">`   | `<Typography variant="body1">`                  |
| `<Text size="base">` | `<Typography variant="body1">`                  |
| `<Text size="sm">`   | `<Typography variant="body2">`                  |
| `<P>`                | `<Typography variant="body1">`                  |
| `<Span>`             | `<Typography variant="body1" component="span">` |
| `<Caption>`          | `<Typography variant="caption">`                |

### Font Weights

| Legacy                        | Typography                                          |
| ----------------------------- | --------------------------------------------------- |
| `<Heading weight="normal">`   | `<Typography variant="h1" fontWeight="regular">`    |
| `<Heading weight="medium">`   | `<Typography variant="h1" fontWeight="medium">`     |
| `<Heading weight="semibold">` | `<Typography variant="h1" fontWeight="medium">`     |
| `<Heading weight="bold">`     | `<Typography variant="h1" fontWeight="bold">`       |
| `<Text weight="normal">`      | `<Typography variant="body1" fontWeight="regular">` |
| `<Text weight="medium">`      | `<Typography variant="body1" fontWeight="medium">`  |
| `<Text weight="semibold">`    | `<Typography variant="body1" fontWeight="medium">`  |
| `<Text weight="bold">`        | `<Typography variant="body1" fontWeight="bold">`    |

### Colors

| Legacy                       | Typography                                     |
| ---------------------------- | ---------------------------------------------- |
| `<Text color="default">`     | `<Typography variant="body1" color="text">`    |
| `<Text color="muted">`       | `<Typography variant="body1" color="light">`   |
| `<Text color="primary">`     | `<Typography variant="body1" color="primary">` |
| `<Text color="destructive">` | `<Typography variant="body1" color="error">`   |
| `<Text color="success">`     | `<Typography variant="body1" color="success">` |
| `<Text color="warning">`     | `<Typography variant="body1" color="warning">` |
| `<Text color="info">`        | `<Typography variant="body1" color="info">`    |

## Migration Examples

### Example 1: Page Header

**Before:**

```tsx
import { Heading, Text } from '@/app/v2/shared/components/ui/typography'
;<div className="text-center space-y-4">
  <Heading size="4xl" weight="bold">
    Welcome to Our Platform
  </Heading>
  <Text size="lg" color="muted">
    A comprehensive solution for modern applications
  </Text>
</div>
```

**After:**

```tsx
import { Typography } from '@/app/v2/shared/components/ui/typography'
;<div className="text-center space-y-4">
  <Typography variant="h1">Welcome to Our Platform</Typography>
  <Typography variant="subtitle1" color="light">
    A comprehensive solution for modern applications
  </Typography>
</div>
```

### Example 2: Feature Section

**Before:**

```tsx
import { Heading, Text } from '@/app/v2/shared/components/ui/typography'
;<div className="space-y-3">
  <Heading size="xl" weight="medium" color="primary">
    Easy Integration
  </Heading>
  <Text size="base">
    Simple and intuitive API that makes it easy to integrate into any project.
  </Text>
</div>
```

**After:**

```tsx
import { Typography } from '@/app/v2/shared/components/ui/typography'
;<div className="space-y-3">
  <Typography variant="h4" color="primary" fontWeight="medium">
    Easy Integration
  </Typography>
  <Typography variant="body1">
    Simple and intuitive API that makes it easy to integrate into any project.
  </Typography>
</div>
```

### Example 3: Button Text

**Before:**

```tsx
import { Text } from '@/app/v2/shared/components/ui/typography'
;<button className="px-6 py-3 bg-primary text-white rounded-lg">
  <Text size="sm" weight="medium" className="uppercase">
    Get Started
  </Text>
</button>
```

**After:**

```tsx
import { Typography } from '@/app/v2/shared/components/ui/typography'
;<button className="px-6 py-3 bg-primary text-white rounded-lg">
  <Typography variant="button" color="white">
    Get Started
  </Typography>
</button>
```

### Example 4: Statistics Display

**Before:**

```tsx
import { Heading, Text, Caption } from '@/app/v2/shared/components/ui/typography'
;<div className="text-center">
  <Heading size="2xl" weight="bold" color="primary">
    10K+
  </Heading>
  <Caption color="muted" className="uppercase">
    Active Users
  </Caption>
</div>
```

**After:**

```tsx
import { Typography } from '@/app/v2/shared/components/ui/typography'
;<div className="text-center">
  <Typography variant="h2" color="primary" fontWeight="bold">
    10K+
  </Typography>
  <Typography variant="caption" color="light" textTransform="uppercase">
    Active Users
  </Typography>
</div>
```

## Advanced Features

### New Features Available

1. **Gradient Text:**

```tsx
<Typography variant="h1" textGradient>
  Beautiful Gradient Title
</Typography>
```

2. **Text Transform:**

```tsx
<Typography variant="body1" textTransform="uppercase">UPPERCASE TEXT</Typography>
<Typography variant="body1" textTransform="capitalize">capitalize text</Typography>
```

3. **Opacity Control:**

```tsx
<Typography variant="body1" opacity={0.7}>
  Muted text
</Typography>
```

4. **Component Override:**

```tsx
<Typography variant="body1" component="h1">
  Body text as heading
</Typography>
```

## Migration Strategy

### Phase 1: Preparation

1. Install the new component
2. Update imports in a few test files
3. Verify functionality

### Phase 2: Gradual Migration

1. Start with new components/features
2. Migrate existing components one file at a time
3. Use search and replace for common patterns

### Phase 3: Cleanup

1. Remove legacy component imports
2. Update documentation
3. Remove legacy component files

## Search and Replace Patterns

### For VS Code / Find and Replace:

**Pattern 1: Heading components**

```
Find: <Heading size="(\w+)" weight="(\w+)"
Replace: <Typography variant="h$1" fontWeight="$2"
```

**Pattern 2: Text components**

```
Find: <Text size="(\w+)" color="(\w+)"
Replace: <Typography variant="body1" color="$2"
```

**Pattern 3: Import statements**

```
Find: import \{ (Heading|Text|H1|H2|H3|H4|H5|H6|P|Span|Caption),? ?\} from '@/app/v2/shared/components/ui/typography'
Replace: import { Typography } from '@/app/v2/shared/components/ui/typography'
```

## Testing Migration

After migrating each component:

1. **Visual Testing:** Check that the appearance matches the original
2. **Functionality Testing:** Ensure all interactive elements work
3. **Accessibility Testing:** Verify screen reader compatibility
4. **Responsive Testing:** Test on different screen sizes

## Rollback Plan

If issues arise during migration:

1. Keep legacy components available during transition
2. Use feature flags to toggle between old and new components
3. Maintain separate branches for migration work
4. Document any breaking changes

## Support

For questions or issues during migration:

1. Check the component documentation
2. Review the demo examples
3. Run the test suite for guidance
4. Create an issue in the project repository
