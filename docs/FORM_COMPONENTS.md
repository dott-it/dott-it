# Form Components

This document describes the form components available in the Dott.it Workspace application. These components provide consistent form styling and behavior across the application.

## FormField Component

The `FormField` component combines a label, input, description, and error message into a single, accessible form field.

### Basic Usage

```tsx
import { FormField } from '@/app/v2/shared/components/forms'

function MyForm() {
  const [email, setEmail] = useState('')

  return (
    <FormField
      label="Email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="Enter your email"
      required
    />
  )
}
```

### Props

| Prop                 | Type      | Default | Description                                                   |
| -------------------- | --------- | ------- | ------------------------------------------------------------- |
| `label`              | `string`  | -       | **Required.** The label text for the input field              |
| `description`        | `string`  | -       | Optional description text shown below the label               |
| `error`              | `string`  | -       | Error message to display. When present, applies error styling |
| `required`           | `boolean` | `false` | Shows a red asterisk next to the label when true              |
| `containerClassName` | `string`  | -       | Additional CSS classes for the container div                  |
| `className`          | `string`  | -       | Additional CSS classes for the input element                  |

All other props from `React.InputHTMLAttributes<HTMLInputElement>` are supported and passed through to the input element.

### Examples

#### Basic Text Input

```tsx
<FormField label="Full Name" placeholder="Enter your full name" required />
```

#### Input with Description

```tsx
<FormField
  label="Username"
  description="This will be visible to other users"
  placeholder="Choose a username"
  required
/>
```

#### Input with Error

```tsx
<FormField
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  required
/>
```

#### Password Input

```tsx
<FormField label="Password" type="password" description="Must be at least 8 characters" required />
```

#### Custom Styling

```tsx
<FormField label="Special Input" containerClassName="mb-6" className="border-2 border-blue-500" />
```

### Accessibility Features

The `FormField` component includes several accessibility features:

- **Proper labeling**: The label is correctly associated with the input using `htmlFor` and `id`
- **Error announcements**: Error messages have `role="alert"` for screen reader announcements
- **ARIA attributes**: Includes `aria-invalid`, `aria-describedby` for enhanced accessibility
- **Required indicators**: Visual and semantic indication of required fields

### Styling States

#### Default State

- Clean, minimalist design following the application's design system
- Proper spacing and typography using the design tokens

#### Focus State

- Highlighted border and focus ring
- Consistent with other interactive elements

#### Error State

- Red border on the input field
- Red text for the label and error message
- Maintains accessibility with proper ARIA attributes

#### Disabled State

- All standard HTML input disabled behaviors
- Consistent visual treatment

### Integration with Forms

The `FormField` component works seamlessly with form libraries:

#### With React Hook Form

```tsx
import { useForm } from 'react-hook-form'
import { FormField } from '@/app/v2/shared/components/forms'

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Email"
        type="email"
        {...register('email', { required: 'Email is required' })}
        error={errors.email?.message}
        required
      />

      <FormField
        label="Password"
        type="password"
        {...register('password', { required: 'Password is required' })}
        error={errors.password?.message}
        required
      />
    </form>
  )
}
```

#### With Formik

```tsx
import { Formik, Form } from 'formik'
import { FormField } from '@/app/v2/shared/components/forms'

function MyForm() {
  return (
    <Formik initialValues={{ email: '', password: '' }} onSubmit={handleSubmit}>
      {({ values, errors, handleChange }) => (
        <Form>
          <FormField
            label="Email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
        </Form>
      )}
    </Formik>
  )
}
```

### Best Practices

1. **Consistent Labeling**: Always provide clear, descriptive labels
2. **Error Messages**: Provide specific, actionable error messages
3. **Required Fields**: Mark required fields consistently with the `required` prop
4. **Descriptions**: Use descriptions for fields that need clarification
5. **Validation**: Implement proper client-side and server-side validation

### Migration from Individual Components

#### Before

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className={error ? 'border-red-500' : ''}
  />
  {error && <p className="text-red-500 text-sm">{error}</p>}
</div>
```

#### After

```tsx
<FormField
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
/>
```

### Benefits

1. **Consistency**: Uniform appearance and behavior across forms
2. **Accessibility**: Built-in accessibility features
3. **Developer Experience**: Simplified API reduces boilerplate
4. **Maintainability**: Centralized form field logic
5. **Type Safety**: Full TypeScript support

## Zod Schemas for Backoffice Forms

- Assessment template forms reuse the shared schema in `app/(dashboard)/backoffice/assessment-templates/schemas.ts`.
- Assessment creation forms validate payloads through `app/(dashboard)/backoffice/assessments/schemas.ts`.
- Both schemas power the UI validation and can be imported in server actions or services to keep business rules aligned.
