"use client"

import { useEffect, useState } from "react"
import { PickupCalendar } from "@/components/admin/pickup-calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin/header"
import { PickupOrders } from "@/components/admin/pickup-orders"
import { Skeleton } from "@/components/ui/skeleton"

interface PickupStats {
  scheduled: {
    total: number
    lastHour: number
  }
  completed: {
    total: number
    percentChange: number
  }
}

export default function PickupPage() {
  const [stats, setStats] = useState<PickupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/pickup-stats')
        if (!response.ok) {
          throw new Error('Failed to fetch pickup statistics')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching pickup stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <AdminHeader title="Pickup Management" showDatePicker />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">+{stats?.scheduled.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.scheduled.lastHour || 0} since last hour
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">+{stats?.completed.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.completed.percentChange >= 0 ? '+' : ''}{stats?.completed.percentChange.toFixed(1) || 0}% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-2">
          <PickupCalendar />
        </div>
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Pickup Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PickupOrders />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
