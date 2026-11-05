import { Button } from '@/app/lib/components/ui/buttons/button-compounds'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

export function getButtonComponent(variant: ButtonVariant) {
  switch (variant) {
    case 'primary': {
      return Button.Action
    }
    case 'secondary': {
      return Button.Secondary
    }
    case 'outline': {
      return Button.Outline
    }
    case 'ghost': {
      return Button.Ghost
    }
    default: {
      return Button.Action
    } // fallback
  }
}
