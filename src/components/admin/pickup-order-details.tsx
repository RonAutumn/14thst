"use client"

import { useState } from "react"
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
import { OrderStatus } from "@/types/orders"
import { format } from "date-fns"

interface PickupOrderDetailsProps {
  order: {
    id: string;
    orderId: string;
    customerName: string;
    email: string;
    phone: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    status: OrderStatus;
    total: number;
    timestamp: string;
    pickupDate: string;
    pickupTime: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

const ORDER_STATUSES: { value: OrderStatus; label: string; variant: "default" | "secondary" | "destructive" | "outline" }[] = [
  { value: 'pending', label: 'Pending', variant: 'outline' },
  { value: 'processing', label: 'Processing', variant: 'secondary' },
  { value: 'completed', label: 'Completed', variant: 'default' },
  { value: 'cancelled', label: 'Cancelled', variant: 'destructive' },
]

export function PickupOrderDetails({ 
  order, 
  open, 
  onOpenChange, 
  onStatusUpdate 
}: PickupOrderDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status || 'pending')

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!onStatusUpdate) return
    
    try {
      setIsUpdating(true)
      await onStatusUpdate(order.id, newStatus)
      setCurrentStatus(newStatus)
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Helper function to format price
  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '0.00'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - #{order.orderId}</span>
            <Badge
              variant={ORDER_STATUSES.find(s => s.value === currentStatus)?.variant || 'outline'}
              className="ml-2"
            >
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 mt-4">
          {/* Order Status */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Order Status</h3>
            <Select
              value={currentStatus}
              onValueChange={handleStatusChange}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Order Items */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span>${formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Pickup Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Pickup Information</h3>
            <div className="grid gap-2">
              <div>
                <span className="text-sm text-muted-foreground">Pickup Date:</span>
                <p>{format(new Date(order.pickupDate), 'MMMM d, yyyy')}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Pickup Time:</span>
                <p>{order.pickupTime}</p>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="grid gap-2">
              <div>
                <span className="text-sm text-muted-foreground">Name:</span>
                <p>{order.customerName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p>{order.email}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Phone:</span>
                <p>{order.phone}</p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 