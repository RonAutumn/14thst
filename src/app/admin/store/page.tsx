"use client"

import { StoreManagement } from "@/components/admin/store-management"

export default function StorePage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Store Management</h2>
      </div>
      <StoreManagement />
    </div>
  )
} 