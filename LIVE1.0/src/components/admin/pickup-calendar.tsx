"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import type { DeliveryOrder } from "@/types/orders"

export function PickupCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/delivery-orders')
        if (!response.ok) throw new Error('Failed to fetch orders')
        const data = await response.json()
        setOrders(data.orders)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load delivery orders"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [toast])

  const getOrdersForDate = (date: Date) => {
    return orders.filter(order => {
      if (!order.deliveryDate) return false;
      const orderDate = new Date(order.deliveryDate);
      return orderDate.toDateString() === date.toDateString();
    });
  }

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Pickup Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-md" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Pickup Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          modifiers={{
            pickup: (date) => {
              // All days are pickup days
              return true;
            }
          }}
          modifiersStyles={{
            pickup: {
              fontWeight: 'bold',
              backgroundColor: 'var(--primary)',
              color: 'white',
              borderRadius: '4px'
            }
          } as const}
        />
        {date && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">
              Orders for {date.toLocaleDateString()}
            </h3>
            <div className="space-y-2">
              {getOrdersForDate(date).map(order => (
                <div key={order.id} className="p-2 border rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">{order.customerName}</span>
                    <span className="text-sm text-gray-500">{order.status}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Total: ${order.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
