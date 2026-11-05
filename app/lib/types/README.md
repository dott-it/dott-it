# Types Organization

This directory contains all TypeScript type definitions organized by domain and functionality.

## Structure

```
types/
├── auth/           # Authentication and user-related types
│   ├── auth.ts     # User, AuthSession interfaces
│   └── index.ts    # Re-exports
├── assessments/    # Assessment and student record types
│   ├── assessment.ts # Assessment, StudentRecord interfaces
│   └── index.ts    # Re-exports
├── components/     # UI component types
│   ├── components.ts # BaseComponentProps, Theme, Status, Size, Variant types
│   └── index.ts    # Re-exports
├── forms/          # Form-related types
│   ├── forms.ts    # FormField interface
│   └── index.ts    # Re-exports
├── api/            # API response and utility types
│   └── responses.ts # ApiResponse, Pagination, Filter, Sort interfaces
└── index.ts        # Main re-export file
```

## Usage

### Import from specific domain

```typescript
import { Assessment, StudentRecord } from '@/app/types/assessments'
import { User, AuthSession } from '@/app/types/auth'
import { FormField } from '@/app/types/forms'
import { BaseComponentProps, Theme } from '@/app/types/components'
```

### Import all types

```typescript
import { Assessment, User, FormField, BaseComponentProps } from '@/app/types'
```

## Type Categories

### Auth Types (`auth/`)

- **User**: User profile information
- **AuthSession**: Authentication session data

### Assessment Types (`assessments/`)

- **Assessment**: Assessment metadata and statistics
- **StudentRecord**: Individual student progress and status

### Component Types (`components/`)

- **BaseComponentProps**: Common props for UI components
- **Theme**: Theme variants (light, dark, system)
- **Status**: Component status states
- **Size**: Component size variants
- **Variant**: Component style variants

### Form Types (`forms/`)

- **FormField**: Form field configuration and validation

### API Types (`api/`)

- **ApiResponse**: Generic API response wrapper
- **Pagination**: Pagination metadata
- **Filter**: Data filtering configuration
- **Sort**: Data sorting configuration

## Adding New Types

1. **Choose the appropriate category** based on the type's purpose
2. **Add the type definition** to the corresponding `.ts` file
3. **Export the type** from the category's `index.ts` file
4. **Update this README** if adding a new category or significant changes

## Migration Notes

- Types were reorganized from the previous flat structure to domain-specific folders
- All existing imports have been updated to use the new structure
- Backward compatibility is maintained through the main `index.ts` file
