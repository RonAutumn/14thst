import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const slidePanelVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

export interface BaseSlidePanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof slidePanelVariants> {
  component: any
  portal?: any
  overlay?: any
  shouldScaleBackground?: boolean
}

export const BaseSlidePanel = React.forwardRef<
  HTMLDivElement,
  BaseSlidePanelProps
>(({ className, side, component: Component, portal: Portal, overlay: Overlay, shouldScaleBackground = true, children, ...props }, ref) => {
  const content = (
    <Component
      ref={ref}
      className={cn(slidePanelVariants({ side }), className)}
      {...props}
    >
      {children}
    </Component>
  )

  if (Portal) {
    return (
      <Portal>
        {Overlay && <Overlay className="fixed inset-0 z-50 bg-black/80" />}
        {content}
      </Portal>
    )
  }

  return content
})
BaseSlidePanel.displayName = "BaseSlidePanel"

export const BaseSlidePanelHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
BaseSlidePanelHeader.displayName = "BaseSlidePanelHeader"

export const BaseSlidePanelFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
BaseSlidePanelFooter.displayName = "BaseSlidePanelFooter"

export const BaseSlidePanelTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
BaseSlidePanelTitle.displayName = "BaseSlidePanelTitle"

export const BaseSlidePanelDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
BaseSlidePanelDescription.displayName = "BaseSlidePanelDescription" 