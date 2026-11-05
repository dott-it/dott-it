import * as React from 'react'
import { Button, type ButtonProps } from './button'
import { cn } from '@/app/lib/utils/utils'
import { Circle, ArrowRight } from 'lucide-react'

// Interface for compound button component
interface ButtonComponent
  extends React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>> {
  Primary: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant'> & React.RefAttributes<HTMLButtonElement>
  >
  Secondary: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant'> & React.RefAttributes<HTMLButtonElement>
  >
  Outline: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant'> & React.RefAttributes<HTMLButtonElement>
  >
  Ghost: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant'> & React.RefAttributes<HTMLButtonElement>
  >
  Destructive: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant'> & React.RefAttributes<HTMLButtonElement>
  >
  Link: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant'> & React.RefAttributes<HTMLButtonElement>
  >
  Small: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  Large: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  Icon: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  // Common combinations
  PrimarySmall: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant' | 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  PrimaryLarge: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant' | 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  OutlineSmall: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant' | 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  OutlineLarge: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant' | 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  // Action buttons
  Action: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant' | 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  ActionSmall: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant' | 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  // Navigation buttons
  Nav: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant' | 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  NavSmall: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant' | 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  // Form buttons
  Submit: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant' | 'size'> & React.RefAttributes<HTMLButtonElement>
  >
  SubmitWithLoading: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant' | 'size'> & {
      isLoading?: boolean
      loadingText?: string
      children: React.ReactNode
    } & React.RefAttributes<HTMLButtonElement>
  >
  Cancel: React.ForwardRefExoticComponent<
    Omit<ButtonProps, 'variant' | 'size'> & React.RefAttributes<HTMLButtonElement>
  >
}

// Base Button with compound components
const ButtonCompound = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return <Button ref={ref} className={cn(className)} {...props} />
  },
) as ButtonComponent

ButtonCompound.displayName = 'Button'

// Variant components
const ButtonPrimary = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="default" {...props} />,
)
ButtonPrimary.displayName = 'Button.Primary'

const ButtonSecondary = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />,
)
ButtonSecondary.displayName = 'Button.Secondary'

const ButtonOutline = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="outline" {...props} />,
)
ButtonOutline.displayName = 'Button.Outline'

const ButtonGhost = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="ghost" {...props} />,
)
ButtonGhost.displayName = 'Button.Ghost'

const ButtonDestructive = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="destructive" {...props} />,
)
ButtonDestructive.displayName = 'Button.Destructive'

const ButtonLink = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="link" {...props} />,
)
ButtonLink.displayName = 'Button.Link'

// Size components
const ButtonSmall = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size'>>((props, ref) => (
  <Button ref={ref} size="sm" {...props} />
))
ButtonSmall.displayName = 'Button.Small'

const ButtonLarge = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size'>>((props, ref) => (
  <Button ref={ref} size="lg" {...props} />
))
ButtonLarge.displayName = 'Button.Large'

const ButtonIcon = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size'>>((props, ref) => (
  <Button ref={ref} size="icon" {...props} />
))
ButtonIcon.displayName = 'Button.Icon'

// Common combinations
const ButtonPrimarySmall = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'variant' | 'size'>
>((props, ref) => <Button ref={ref} variant="default" size="sm" {...props} />)
ButtonPrimarySmall.displayName = 'Button.PrimarySmall'

const ButtonPrimaryLarge = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'variant' | 'size'>
>((props, ref) => <Button ref={ref} variant="default" size="lg" {...props} />)
ButtonPrimaryLarge.displayName = 'Button.PrimaryLarge'

const ButtonOutlineSmall = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'variant' | 'size'>
>((props, ref) => <Button ref={ref} variant="outline" size="sm" {...props} />)
ButtonOutlineSmall.displayName = 'Button.OutlineSmall'

const ButtonOutlineLarge = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'variant' | 'size'>
>((props, ref) => <Button ref={ref} variant="outline" size="lg" {...props} />)
ButtonOutlineLarge.displayName = 'Button.OutlineLarge'

// Action buttons (based on v1 patterns)
const ButtonAction = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'size'>>(
  (props, ref) => (
    <Button ref={ref} variant="default" size="default" className="w-full" {...props} />
  ),
)
ButtonAction.displayName = 'Button.Action'

const ButtonActionSmall = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'variant' | 'size'>
>((props, ref) => <Button ref={ref} variant="default" size="sm" className="w-full" {...props} />)
ButtonActionSmall.displayName = 'Button.ActionSmall'

// Navigation buttons (based on v1 patterns)
const ButtonNav = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'size'>>(
  (props, ref) => (
    <Button
      ref={ref}
      variant="outline"
      size="default"
      className="w-full justify-start"
      {...props}
    />
  ),
)
ButtonNav.displayName = 'Button.Nav'

const ButtonNavSmall = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'size'>>(
  (props, ref) => (
    <Button ref={ref} variant="outline" size="sm" className="w-full justify-start" {...props} />
  ),
)
ButtonNavSmall.displayName = 'Button.NavSmall'

// Form buttons (based on v1 patterns)
const ButtonSubmit = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'size'>>(
  (props, ref) => <Button ref={ref} variant="default" size="default" type="submit" {...props} />,
)
ButtonSubmit.displayName = 'Button.Submit'

const ButtonSubmitWithLoading = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'variant' | 'size'> & {
    isLoading?: boolean
    loadingText?: string
    children: React.ReactNode
  }
>(
  (
    { isLoading = false, loadingText = 'Loading...', children, className, disabled, ...props },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        variant="default"
        size="default"
        type="submit"
        disabled={isLoading || disabled}
        className={cn(className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Circle className="mr-2 size-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            {children}
            <ArrowRight className="ml-2 size-4" />
          </>
        )}
      </Button>
    )
  },
)
ButtonSubmitWithLoading.displayName = 'Button.SubmitWithLoading'

const ButtonCancel = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'size'>>(
  (props, ref) => <Button ref={ref} variant="outline" size="default" type="button" {...props} />,
)
ButtonCancel.displayName = 'Button.Cancel'

// Attach all compound components
ButtonCompound.Primary = ButtonPrimary
ButtonCompound.Secondary = ButtonSecondary
ButtonCompound.Outline = ButtonOutline
ButtonCompound.Ghost = ButtonGhost
ButtonCompound.Destructive = ButtonDestructive
ButtonCompound.Link = ButtonLink

ButtonCompound.Small = ButtonSmall
ButtonCompound.Large = ButtonLarge
ButtonCompound.Icon = ButtonIcon

ButtonCompound.PrimarySmall = ButtonPrimarySmall
ButtonCompound.PrimaryLarge = ButtonPrimaryLarge
ButtonCompound.OutlineSmall = ButtonOutlineSmall
ButtonCompound.OutlineLarge = ButtonOutlineLarge

ButtonCompound.Action = ButtonAction
ButtonCompound.ActionSmall = ButtonActionSmall
ButtonCompound.Nav = ButtonNav
ButtonCompound.NavSmall = ButtonNavSmall
ButtonCompound.Submit = ButtonSubmit
ButtonCompound.SubmitWithLoading = ButtonSubmitWithLoading
ButtonCompound.Cancel = ButtonCancel

export { ButtonCompound as Button }
