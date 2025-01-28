"use client"

import { PickupCalendar } from "@/components/admin/pickup-calendar"
import { AdminHeader } from "@/components/admin/header"
import { PickupOrders } from "@/components/admin/pickup-orders"

export default function PickupPage() {
  return (
    <div className="space-y-6">
      <AdminHeader title="Pickup Management" showDatePicker />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-2">
          <PickupCalendar />
        </div>
        <div className="lg:col-span-5">
          <PickupOrders />
        </div>
      </div>
    </div>
  )
}
