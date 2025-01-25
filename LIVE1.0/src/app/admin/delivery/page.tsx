"use client"

import { DeliveryOrders } from "@/components/admin/delivery-orders"
import { AdminHeader } from "@/components/admin/header"

export default function DeliveryPage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <AdminHeader 
        title="Delivery Management" 
        showDatePicker 
        className="mb-6" 
      />
      <DeliveryOrders />
    </div>
  )
} 