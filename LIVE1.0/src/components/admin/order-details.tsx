"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Order, OrderStatus } from "@/types/orders"

interface OrderDetailsProps {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus) => Promise<void>
}

const ORDER_STATUSES: { value: OrderStatus; label: string; variant: "default" | "secondary" | "destructive" | "outline" }[] = [
  { value: 'pending', label: 'Pending', variant: 'outline' },
  { value: 'processing', label: 'Processing', variant: 'secondary' },
  { value: 'shipped', label: 'Shipped', variant: 'default' },
  { value: 'delivered', label: 'Delivered', variant: 'default' },
  { value: 'cancelled', label: 'Cancelled', variant: 'destructive' },
]

export function OrderDetails({ order, open, onOpenChange, onStatusUpdate }: OrderDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status || 'pending')
  const [deliveryData, setDeliveryData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')

  useEffect(() => {
    setCurrentStatus(order.status || 'pending')
    setTrackingNumber(order.trackingNumber || '')
  }, [order])

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!onStatusUpdate) return
    try {
      setIsUpdating(true)
      await onStatusUpdate(order.id, newStatus)
      setCurrentStatus(newStatus)
      toast.success('Order status updated successfully')
    } catch (error) {
      toast.error('Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleTrackingUpdate = async () => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/shipping-orders/${order.id}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber }),
      })
      if (!response.ok) throw new Error('Failed to update tracking number')
      toast.success('Tracking number updated successfully')
    } catch (error) {
      toast.error('Failed to update tracking number')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Order Details - #{order.orderId}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Status and Tracking Section */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h3 className="font-semibold">Shipping Status</h3>
                <div className="flex items-center gap-4">
                  <Select
                    value={currentStatus}
                    onValueChange={(value: OrderStatus) => handleStatusUpdate(value)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Tracking Number</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="px-3 py-1 border rounded"
                    placeholder="Enter tracking #"
                  />
                  <Button
                    size="sm"
                    onClick={handleTrackingUpdate}
                    disabled={isUpdating}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p>{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p>{order.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Shipping Address</p>
                <p>{order.deliveryAddress}</p>
                <p>{order.borough}</p>
              </div>
            </div>
          </Card>

          {/* Order Items */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Order Items</h3>
            <div className="space-y-4">
              {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-md" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between">
              <p className="font-semibold">Total</p>
              <p className="font-semibold">${order.total.toFixed(2)}</p>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 