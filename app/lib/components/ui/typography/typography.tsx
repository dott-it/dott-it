import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/app/lib/utils/utils'

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-4xl font-bold tracking-tight',
      h2: 'text-3xl font-bold tracking-tight',
      h3: 'text-2xl font-bold tracking-tight',
      h4: 'text-xl font-bold tracking-tight',
      h5: 'text-lg font-bold tracking-tight',
      h6: 'text-base font-bold tracking-tight',
      subtitle1: 'text-lg font-medium leading-relaxed',
      subtitle2: 'text-base font-medium leading-relaxed',
      body1: 'text-base leading-relaxed',
      body2: 'text-sm leading-relaxed',
      button: 'text-sm font-medium uppercase tracking-wide',
      caption: 'text-xs leading-relaxed',
      overline: 'text-xs font-medium uppercase tracking-widest',
      inherit: 'inherit',
    },
    color: {
      inherit: 'text-inherit',
      primary: 'text-primary',
      secondary: 'text-secondary',
      muted: 'text-muted-foreground',
      info: 'text-blue-600 dark:text-blue-400',
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      error: 'text-red-600 dark:text-red-400',
      light: 'text-gray-300 dark:text-gray-600',
      dark: 'text-gray-900 dark:text-gray-100',
      text: 'text-foreground',
      white: 'text-white',
    },
    fontWeight: {
      light: 'font-light',
      regular: 'font-normal',
      medium: 'font-medium',
      bold: 'font-bold',
    },
    textTransform: {
      none: '',
      capitalize: 'capitalize',
      uppercase: 'uppercase',
      lowercase: 'lowercase',
    },
    verticalAlign: {
      unset: '',
      baseline: 'align-baseline',
      sub: 'align-sub',
      super: 'align-super',
      'text-top': 'align-text-top',
      'text-bottom': 'align-text-bottom',
      middle: 'align-middle',
      top: 'align-top',
      bottom: 'align-bottom',
    },
    textGradient: {
      true: 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent',
      false: '',
    },
    opacity: {
      1: 'opacity-100',
      0.9: 'opacity-90',
      0.8: 'opacity-80',
      0.7: 'opacity-70',
      0.6: 'opacity-60',
      0.5: 'opacity-50',
      0.4: 'opacity-40',
      0.3: 'opacity-30',
      0.2: 'opacity-20',
      0.1: 'opacity-10',
    },
  },
  defaultVariants: {
    variant: 'body1',
    color: 'dark',
    textTransform: 'none',
    verticalAlign: 'unset',
    textGradient: false,
    opacity: 1,
  },
})

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  component?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label' | 'caption' | 'pre'
  children: React.ReactNode
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  (
    {
      className,
      variant,
      color,
      fontWeight,
      textTransform,
      verticalAlign,
      textGradient,
      opacity,
      component,
      children,
      ...props
    },
    ref,
  ) => {
    // Determine the HTML element based on variant and component prop
    const getComponent = (): keyof React.JSX.IntrinsicElements => {
      if (component) {
        return component
      }

      // Check if variant is a heading
      if (variant && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(variant)) {
        return variant as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      }

      // Check if variant should render as span
      if (variant && ['button', 'caption', 'overline'].includes(variant)) {
        return 'span'
      }

      // Default to paragraph
      return 'p'
    }

    const Component = getComponent() as React.ElementType

    return (
      <Component
        ref={ref}
        className={cn(
          typographyVariants({
            variant,
            color,
            fontWeight,
            textTransform,
            verticalAlign,
            textGradient,
            opacity,
            className,
          }),
        )}
        {...props}
      >
        {children}
      </Component>
    )
  },
)

Typography.displayName = 'Typography'

export { Typography, typographyVariants }
