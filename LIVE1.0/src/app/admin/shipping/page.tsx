"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSkeleton } from "@/components/admin/loading-skeleton"
import { AdminHeader } from "@/components/admin/header"
import { ShippingOrders } from "@/components/admin/shipping-orders"
import { OrderStatus, OrderItem } from "@/types/orders"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ShippingFee {
  method: string
  fee: number
  freeShippingMinimum: number
}

export default function ShippingPage() {
  const [shippingFees, setShippingFees] = useState<ShippingFee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/shipping-fees')
        if (!response.ok) throw new Error('Failed to fetch shipping fees')
        const data = await response.json()
        
        // Ensure we have an array of shipping fees
        const fees = Array.isArray(data) ? data : 
                    Array.isArray(data.shippingFees) ? data.shippingFees : 
                    []
                    
        // Validate the structure of each fee
        const validFees = fees.filter((fee: any) => 
          fee && 
          typeof fee.method === 'string' && 
          typeof fee.fee === 'number' && 
          typeof fee.freeShippingMinimum === 'number'
        )
        
        setShippingFees(validFees)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
        console.error('Error fetching data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AdminHeader
        title="Shipping Management"
        description="Manage shipping orders and track shipments"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Always show ShippingOrders component */}
      <ShippingOrders />

      {/* Show shipping fees if available */}
      {!isLoading && shippingFees.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Fees</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shippingFees.map((fee, index) => (
              <Card key={index} className="p-4">
                <h3 className="font-medium">{fee.method}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Fee: ${fee.fee.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Free shipping over: ${fee.freeShippingMinimum.toFixed(2)}
                </p>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
} 