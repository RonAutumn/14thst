"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CalendarDateRangePicker } from "./date-range-picker"

interface AdminHeaderProps {
  title: string
  description?: string
  showDatePicker?: boolean
  showLogout?: boolean
  className?: string
}

export function AdminHeader({ 
  title,
  description,
  showDatePicker = false, 
  showLogout = true,
  className = ""
}: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      localStorage.removeItem('adminAuth')
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {showDatePicker && <CalendarDateRangePicker />}
        {showLogout && (
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        )}
      </div>
    </div>
  )
}
