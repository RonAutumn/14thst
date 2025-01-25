import * as React from "react"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { menuAnimationClasses, slideAnimationClasses, contentBaseClasses } from "@/lib/shared-patterns"

// Base menu item components that can be reused
export const BaseMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<any> & {
    inset?: boolean
    component: any
  }
>(({ className, inset, component: Component, ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
BaseMenuItem.displayName = "BaseMenuItem"

export const BaseMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<any> & {
    component: any
    portal?: any
  }
>(({ className, component: Component, portal: Portal, ...props }, ref) => {
  const content = (
    <Component
      ref={ref}
      className={cn(
        contentBaseClasses,
        menuAnimationClasses,
        slideAnimationClasses,
        className
      )}
      {...props}
    />
  )

  if (Portal) {
    return <Portal>{content}</Portal>
  }

  return content
})
BaseMenuContent.displayName = "BaseMenuContent"

export const BaseMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<any> & {
    component: any
    indicator: any
  }
>(({ className, children, checked, component: Component, indicator: Indicator, ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Indicator>
        <Check className="h-4 w-4" />
      </Indicator>
    </span>
    {children}
  </Component>
))
BaseMenuCheckboxItem.displayName = "BaseMenuCheckboxItem"

export const BaseMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<any> & {
    component: any
    indicator: any
  }
>(({ className, children, component: Component, indicator: Indicator, ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Indicator>
        <Circle className="h-2 w-2 fill-current" />
      </Indicator>
    </span>
    {children}
  </Component>
))
BaseMenuRadioItem.displayName = "BaseMenuRadioItem"

export const BaseMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<any> & {
    component: any
    inset?: boolean
  }
>(({ className, inset, component: Component, ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
BaseMenuLabel.displayName = "BaseMenuLabel"

export const BaseMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<any> & {
    component: any
  }
>(({ className, component: Component, ...props }, ref) => (
  <Component
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
))
BaseMenuSeparator.displayName = "BaseMenuSeparator"

export const BaseMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
BaseMenuShortcut.displayName = "BaseMenuShortcut" 