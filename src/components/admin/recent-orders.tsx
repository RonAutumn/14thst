"use client"

import { useEffect, useState } from "react"
import { Order, OrderItem, OrderStatus } from "@/types/orders"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/orders')
        const data = await response.json()
        
        // Combine and sort all orders by timestamp
        const allOrders = [...(data.delivery || []), ...(data.shipping || [])]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5) // Only show latest 5 orders
          .map((order: any): Order => ({
            ...order,
            items: Array.isArray(order.items) 
              ? order.items.map((item: any): OrderItem => ({
                  ...item,
                  unitPrice: item.price || 0,
                  weight: item.weight || 0
                }))
              : [],
            status: (order.status as OrderStatus) || 'pending',
            total: typeof order.total === 'number' ? order.total : 0
          }))
        
        setOrders(allOrders)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[70px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderId}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{(order.items || []).length} items</TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      order.status === "pending" && "bg-yellow-100 text-yellow-800",
                      order.status === "processing" && "bg-blue-100 text-blue-800",
                      order.status === "shipped" && "bg-purple-100 text-purple-800",
                      order.status === "delivered" && "bg-green-100 text-green-800",
                      order.status === "cancelled" && "bg-red-100 text-red-800",
                      order.status === "refunded" && "bg-gray-100 text-gray-800",
                      order.status === "failed" && "bg-red-100 text-red-800",
                      order.status === "on-hold" && "bg-orange-100 text-orange-800"
                    )}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    ${(order.total ?? 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 