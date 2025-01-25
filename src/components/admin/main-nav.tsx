"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  Bike,
  Store
} from "lucide-react"

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Delivery Orders",
    href: "/admin/delivery",
    icon: Bike,
  },
  {
    title: "Shipping Orders",
    href: "/admin/shipping",
    icon: Truck,
  },
  {
    title: "Store Management",
    href: "/admin/store",
    icon: Store,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  isCollapsed?: boolean
}

export function MainNav({ className, isCollapsed, ...props }: MainNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex space-y-2", className)} {...props}>
      <ScrollArea className="w-full">
        <div className="space-y-2 py-2">
          {sidebarNavItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                pathname === item.href && "bg-muted font-medium",
                isCollapsed && "h-9 w-9 p-0 justify-center"
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && item.title}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </nav>
  )
} 