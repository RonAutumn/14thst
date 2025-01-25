import { toast } from "sonner"

type ToastType = "success" | "error" | "info" | "warning"

interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export const showToast = (
  type: ToastType,
  title: string,
  options?: ToastOptions
) => {
  const { description, duration = 3000, action } = options || {}

  const toastOptions = {
    duration,
    description,
    ...(action && {
      action: {
        label: action.label,
        onClick: action.onClick,
      },
    }),
  }

  switch (type) {
    case "success":
      toast.success(title, toastOptions)
      break
    case "error":
      toast.error(title, toastOptions)
      break
    case "warning":
      toast.warning(title, toastOptions)
      break
    case "info":
      toast.info(title, toastOptions)
      break
    default:
      toast(title, toastOptions)
  }
}

// Convenience methods
export const successToast = (title: string, options?: ToastOptions) =>
  showToast("success", title, options)

export const errorToast = (title: string, options?: ToastOptions) =>
  showToast("error", title, options)

export const warningToast = (title: string, options?: ToastOptions) =>
  showToast("warning", title, options)

export const infoToast = (title: string, options?: ToastOptions) =>
  showToast("info", title, options)
