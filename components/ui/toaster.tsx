"use client"

// import { useToast } from "@/hooks/use-toast" // Temporarily disabled
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = { toasts: [] } // useToast() // Temporarily disabled

  return (
    <ToastProvider>
      {toasts.map(function (toast: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        const { id, title, description, action, ...props } = toast
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
