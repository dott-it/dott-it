# UI Components Structure

This directory contains all UI components organized by category for better maintainability and discoverability.

## 📁 Directory Structure

```
ui/
├── buttons/           # Button components
│   ├── button.tsx           # Base button component
│   ├── button-compounds.tsx # Compound button components
│   ├── button-demo.tsx      # Button demonstration
│   ├── google-button.tsx    # Google OAuth button
│   └── index.ts             # Button exports
├── forms/             # Form components
│   ├── input.tsx            # Input component
│   ├── label.tsx            # Label component
│   ├── form-field.tsx       # Compound form field component
│   ├── form-field-demo.tsx  # Form field demonstration
│   └── index.ts             # Form exports
├── feedback/          # Feedback components
│   ├── alert.tsx            # Alert component
│   ├── badge.tsx            # Badge component
│   ├── progress.tsx         # Progress component
│   ├── assessment-card.tsx  # Assessment card component
│   ├── live-collection-modal.tsx # Live collection modal
│   └── index.ts             # Feedback exports
├── layout/            # Layout components
│   ├── card.tsx             # Card component
│   ├── dialog.tsx           # Dialog component
│   └── index.ts             # Layout exports
├── typography/        # Typography components
│   ├── heading.tsx          # Base heading component
│   ├── text.tsx             # Base text component
│   ├── h1.tsx-h6.tsx        # Specific heading components
│   ├── p.tsx                # Paragraph component with compounds
│   ├── span.tsx             # Span component
│   ├── muted-text.tsx       # Muted text
│   ├── small-text.tsx       # Small text
│   ├── caption.tsx          # Caption text
│   ├── lead.tsx             # Lead text
│   └── index.ts             # Typography exports
├── index.ts           # Main UI exports
└── README.md          # This file
```

## 🎯 Component Categories

### Buttons (`/buttons`)

All button-related components including:

- **Base Button**: Traditional button with variant/size props
- **Compound Buttons**: Pre-configured button components (e.g., `Button.Primary`, `Button.OutlineSmall`)
- **Google Button**: OAuth sign-in button
- **Demo**: Visual demonstration of all button variations

### Forms (`/forms`)

Form input and compound components:

- **Input**: Text input component
- **Label**: Form label component
- **FormField**: Compound form field (label + input + validation)
- **FormFieldDemo**: Visual demonstration of form fields

### Feedback (`/feedback`)

User feedback, status components, and assessment-related components:

- **Alert**: Notification messages
- **Badge**: Status indicators and labels
- **Progress**: Progress bars and indicators
- **AssessmentCard**: Assessment display cards
- **LiveCollectionModal**: Modal for live data collection

### Layout (`/layout`)

Layout and container components:

- **Card**: Content containers with header, content, and footer
- **Dialog**: Modal dialogs and overlays

### Typography (`/typography`)

Text and heading components with consistent styling:

- **Base Components**: `Heading`, `Text` for flexible usage
- **Semantic Headings**: `H1`-`H6` with fixed sizes
- **Text Components**: `P` with compound variants (`P.Muted`, `P.Small`, etc.)
- **Utility Components**: `Span`, `MutedText`, `SmallText`, `Caption`, `Lead`

## 📦 Usage

### Import from specific category

```tsx
// Import specific button components
import { Button, ButtonCompound } from '@/app/v2/shared/components/ui/buttons'

// Import form components
import { Input, Label } from '@/app/v2/shared/components/ui/forms'

// Import feedback components
import { Alert, Badge, Progress } from '@/app/v2/shared/components/ui/feedback'

// Import layout components
import { Card, Dialog } from '@/app/v2/shared/components/ui/layout'

// Import typography components
import { H1, P, Caption } from '@/app/v2/shared/components/ui/typography'
```

### Import from main UI index

```tsx
// Import all UI components
import { Button, Input, Card, Alert, H1, P } from '@/app/v2/shared/components/ui'
```

### Import from shared components

```tsx
// Import from main shared components index
import { Button, FormField, AssessmentCard, H1, P } from '@/app/v2/shared/components'
```

## 🔧 Benefits of This Structure

### 1. **Organization**

- Components are grouped by functionality
- Easy to find related components
- Clear separation of concerns

### 2. **Maintainability**

- Related components are co-located
- Easier to update and refactor
- Reduced cognitive load

### 3. **Scalability**

- Easy to add new components to appropriate categories
- Clear patterns for organizing new components
- Prevents the UI folder from becoming cluttered

### 4. **Developer Experience**

- Intuitive folder structure
- Clear import paths
- Better IDE support and autocomplete

## 📋 Migration Guide

### Before (Flat Structure)

```tsx
import { Button } from '@/app/v2/shared/components/ui/button'
import { Card } from '@/app/v2/shared/components/ui/card'
import { Input } from '@/app/v2/shared/components/ui/input'
```

### After (Organized Structure)

```tsx
// Option 1: Import from specific categories
import { Button } from '@/app/v2/shared/components/ui/buttons/button'
import { Card } from '@/app/v2/shared/components/ui/layout/card'
import { Input } from '@/app/v2/shared/components/ui/forms/input'

// Option 2: Import from main UI index (recommended)
import { Button, Card, Input } from '@/app/v2/shared/components/ui'
```

## 🚀 Adding New Components

When adding new components, follow these guidelines:

1. **Choose the appropriate category** based on component functionality
2. **Create the component file** in the correct subdirectory
3. **Update the category's index.ts** to export the new component
4. **Update the main UI index.ts** if needed (usually not necessary with `export *`)
5. **Update this README** if adding a new category

### Example: Adding a new form component

```bash
# Create the component
touch app/v2/shared/components/ui/forms/textarea.tsx

# Update forms index.ts
echo "export { Textarea } from './textarea'" >> app/v2/shared/components/ui/forms/index.ts
```

## 🔍 Finding Components

- **Buttons**: Look in `/buttons` for all button variations
- **Form inputs**: Look in `/forms` for input components
- **Status indicators**: Look in `/feedback` for alerts, badges, progress
- **Containers**: Look in `/layout` for cards, dialogs, modals
- **Text styling**: Look in `/typography` for headings, paragraphs, text utilities

## 📚 Related Documentation

- [Button Components](../docs/BUTTON_COMPONENTS.md) - Detailed button documentation
- [Form Components](../docs/FORM_COMPONENTS.md) - Form component documentation
- [Typography Components](./typography/README.md) - Typography system documentation
