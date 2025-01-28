"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface PickupOrder {
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
  status: string;
  total: number;
  timestamp: string;
  pickupDate: string;
  pickupTime: string;
}

export function PickupCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [orders, setOrders] = useState<PickupOrder[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/pickup-orders')
        if (!response.ok) throw new Error('Failed to fetch orders')
        const data = await response.json()
        setOrders(data.orders)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load pickup orders"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [toast])

  const getOrdersForDate = (date: Date) => {
    return orders.filter(order => {
      if (!order.pickupDate) return false;
      const orderDate = new Date(order.pickupDate);
      return orderDate.toDateString() === date.toDateString();
    }).sort((a, b) => {
      // Sort by pickup time
      const timeA = a.pickupTime.split(':').map(Number);
      const timeB = b.pickupTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  }

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    if (!onStatusUpdate) return
    
    try {
      const response = await fetch(`/api/order-status/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update order status')
      await onStatusUpdate(orderId, newStatus)
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status"
      })
    }
  }

  if (loading) {
    return <Skeleton className="h-[500px] w-full rounded-md" />
  }

  const ordersForSelectedDate = date ? getOrdersForDate(date) : [];
  const hasOrders = ordersForSelectedDate.length > 0;

  return (
    <Card className="bg-background/5 border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Pickup Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border-0"
            classNames={{
              day_today: "bg-accent text-accent-foreground font-bold",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day: "h-9 w-9 text-sm p-0 font-normal text-white hover:bg-accent/50 aria-selected:opacity-100",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "bg-accent",
              day_hidden: "invisible",
              nav_button: "text-white hover:bg-accent/50 rounded-md",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground w-9 font-normal text-[0.8rem] rounded-md",
              row: "flex w-full mt-2",
              cell: "text-center text-sm relative p-0 rounded-md focus-within:relative focus-within:z-20",
              caption: "flex justify-center pt-1 relative items-center mb-4",
              caption_label: "text-base font-medium text-white",
              nav: "space-x-1 flex items-center",
            }}
            modifiers={{
              pickup: (date) => {
                return orders.some(order => {
                  const orderDate = new Date(order.pickupDate);
                  return orderDate.toDateString() === date.toDateString();
                });
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
            <div className="space-y-4 mt-6">
              <h3 className="text-base font-medium text-white">
                {hasOrders ? (
                  `${ordersForSelectedDate.length} Orders for ${format(date, 'MMMM d, yyyy')}`
                ) : (
                  `No orders for ${format(date, 'MMMM d, yyyy')}`
                )}
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {ordersForSelectedDate.map(order => (
                  <div key={order.id} className="p-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white">#{order.orderId}</h4>
                        <p className="text-sm text-white/70">{order.customerName}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Pickup Time:</span>
                        <span className="font-medium text-white">{formatTime(order.pickupTime)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Items:</span>
                        <span className="text-white">{order.items.length} items</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Total:</span>
                        <span className="font-medium text-white">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
