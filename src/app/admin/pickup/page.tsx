"use client"

import { PickupCalendar } from "@/components/admin/pickup-calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin/header"

export default function PickupPage() {
  return (
    <div className="space-y-6">
      <AdminHeader title="Pickup Management" showDatePicker />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">+201 since last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+1,234</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <PickupCalendar />
        <Card className="col-span-5">
          <CardHeader>
            <CardTitle>Pickup Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Pickup orders list will go here */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
