"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PickupOrderDetails } from "./pickup-order-details"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { OrderStatus } from "@/types/orders"
import { format } from "date-fns"

interface PickupOrder {
  id: string
  orderId: string
  customerName: string
  email: string
  phone: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  status: OrderStatus
  total: number
  timestamp: string
  pickupDate: string
  pickupTime: string
}

type SortField = 'orderId' | 'timestamp' | 'total' | 'pickupDate'
type SortDirection = 'asc' | 'desc'

export function PickupOrders() {
  const [orders, setOrders] = useState<PickupOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('pickupDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<PickupOrder | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/pickup-orders')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        // Transform orders from the API response
        const pickupOrders = (data.orders || []).map((order: any) => ({
          id: order.id || order.orderId,
          orderId: order.orderId || order.id,
          customerName: order.customerName || order['Customer Name'] || 'Unknown',
          email: order.email || order.Email || '',
          phone: order.phone || order.Phone || '',
          items: typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []),
          status: order.status || order.Status || 'pending',
          total: Number(order.total || order.Total) || 0,
          timestamp: order.timestamp || order['Created Time'] || new Date().toISOString(),
          pickupDate: order.pickupDate || order['Pickup Date'] || '',
          pickupTime: order.pickupTime || order['Pickup Time'] || ''
        }))
        
        setOrders(pickupOrders)
      } catch (error) {
        console.error('Error fetching pickup orders:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to fetch pickup orders')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/order-status/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update order status')

      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ))

      toast.success('Order status updated')
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const sortOrders = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      order.orderId.toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      order.email.toLowerCase().includes(searchLower) ||
      order.phone.toLowerCase().includes(searchLower)
    )
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1
    
    switch (sortField) {
      case 'orderId':
        return a.orderId.localeCompare(b.orderId) * modifier
      case 'timestamp':
        return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * modifier
      case 'total':
        return (a.total - b.total) * modifier
      case 'pickupDate':
        return (new Date(a.pickupDate + ' ' + a.pickupTime).getTime() - 
                new Date(b.pickupDate + ' ' + b.pickupTime).getTime()) * modifier
      default:
        return 0
    }
  })

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = orders.filter(order => order.status === 'pending').length
  const completedOrders = orders.filter(order => order.status === 'completed').length

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium">Total Orders</h3>
          <div className="mt-2 text-2xl font-bold">{orders.length}</div>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium">Total Revenue</h3>
          <div className="mt-2 text-2xl font-bold">
            ${totalRevenue.toFixed(2)}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium">Pending Orders</h3>
          <div className="mt-2 text-2xl font-bold">{pendingOrders}</div>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium">Completed Orders</h3>
          <div className="mt-2 text-2xl font-bold">{completedOrders}</div>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pickup orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={() => setSearchQuery('')}>
          Clear
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortOrders('orderId')}
                  className="flex items-center gap-1"
                >
                  Order ID
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortOrders('pickupDate')}
                  className="flex items-center gap-1"
                >
                  Pickup Time
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortOrders('total')}
                  className="flex items-center gap-1"
                >
                  Total
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading pickup orders...
                </TableCell>
              </TableRow>
            ) : sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  {searchQuery ? 'No pickup orders found matching your search' : 'No pickup orders found'}
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.orderId}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{order.email}</div>
                      <div className="text-muted-foreground">{order.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(new Date(order.pickupDate), 'MMM d, yyyy')}</div>
                      <div className="text-muted-foreground">{order.pickupTime}</div>
                    </div>
                  </TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      order.status === "pending" && "bg-yellow-100 text-yellow-800",
                      order.status === "processing" && "bg-blue-100 text-blue-800",
                      order.status === "completed" && "bg-green-100 text-green-800",
                      order.status === "cancelled" && "bg-red-100 text-red-800"
                    )}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'processing')}>
                          Mark as processing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'completed')}>
                          Mark as completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'cancelled')}>
                          Cancel order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedOrder && (
        <PickupOrderDetails
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => {
            if (!open) setSelectedOrder(null)
          }}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
} 