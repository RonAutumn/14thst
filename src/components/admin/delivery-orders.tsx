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
import { OrderDetails } from "./order-details"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { OrderStatus, OrderItem, DeliveryOrder, RawOrderData } from "@/types/orders"
import { parseOrderItems } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"

type SortField = 'orderId' | 'timestamp' | 'total'
type SortDirection = 'asc' | 'desc'

export function DeliveryOrders() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/delivery-orders')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        // Transform orders from the API response
        const deliveryOrders = (data.orders || []).map((order: RawOrderData): DeliveryOrder => {
          const parsedItems = typeof order.items === 'string' 
            ? parseOrderItems(order.items)
            : (order.items as OrderItem[] || [])

          // Ensure we have a valid delivery date
          let deliveryDate = order.deliveryDate || order.timestamp
          try {
            // Validate the date
            const testDate = new Date(deliveryDate)
            if (isNaN(testDate.getTime())) {
              deliveryDate = new Date().toISOString() // Fallback to current date if invalid
            }
          } catch {
            deliveryDate = new Date().toISOString() // Fallback to current date if parsing fails
          }

          return {
            id: order.id || order.orderId || '',
            orderId: order.orderId || order.id || '',
            customerName: order.customerName || 'Unknown',
            email: order.email || '',
            phone: order.phone || '',
            items: parsedItems,
            status: order.status || 'pending',
            total: Number(order.total) || 0,
            timestamp: order.timestamp || new Date().toISOString(),
            type: 'delivery',
            deliveryAddress: order.deliveryAddress || '',
            borough: order.borough || '',
            city: 'New York',
            state: 'NY',
            zipCode: order.zipCode || '',
            paymentMethod: 'card',
            deliveryDate: deliveryDate
          }
        })

        setOrders(deliveryOrders)
      } catch (error) {
        console.error('Error fetching delivery orders:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to fetch delivery orders')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
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

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }

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
      setSortDirection('desc')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      order.orderId.toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      order.borough?.toLowerCase().includes(searchLower) ||
      order.deliveryAddress?.toLowerCase().includes(searchLower)
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
      default:
        return 0
    }
  })

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = orders.filter(order => order.status === 'pending').length
  const processingOrders = orders.filter(order => order.status === 'processing').length
  const completedOrders = orders.filter(order => order.status === 'delivered').length

  // Group orders by delivery date
  const ordersByDate = orders.reduce((acc: { [key: string]: DeliveryOrder[] }, order) => {
    try {
      // Use deliveryDate if available, otherwise use timestamp
      const date = format(new Date(order.deliveryDate || order.timestamp), 'yyyy-MM-dd')
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(order)
    } catch (error) {
      console.error('Error processing date for order:', order.id, error)
    }
    return acc
  }, {})

  // Get orders for selected date
  const getOrdersForDate = (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      return ordersByDate[dateStr] || []
    } catch (error) {
      console.error('Error getting orders for date:', date, error)
      return []
    }
  }

  const selectedDateOrders = selectedDate ? getOrdersForDate(selectedDate) : []

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
          <h3 className="text-sm font-medium">Processing Orders</h3>
          <div className="mt-2 text-2xl font-bold">{processingOrders}</div>
        </Card>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="w-full border-b mb-4">
          <TabsTrigger value="table" className="flex-1">Table View</TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search delivery orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear
            </Button>
          </div>

          <div className="rounded-md border mt-4">
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
                  <TableHead>Borough</TableHead>
                  <TableHead>Items</TableHead>
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
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => sortOrders('timestamp')}
                      className="flex items-center gap-1"
                    >
                      Date
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
                      Loading delivery orders...
                    </TableCell>
                  </TableRow>
                ) : sortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      {searchQuery ? 'No delivery orders found matching your search' : 'No delivery orders found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.orderId}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.borough}</TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>{new Date(order.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          order.status === "pending" && "bg-yellow-100 text-yellow-800",
                          order.status === "processing" && "bg-blue-100 text-blue-800",
                          order.status === "delivered" && "bg-green-100 text-green-800",
                          order.status === "shipped" && "bg-purple-100 text-purple-800",
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
                            <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'shipped')}>
                              Mark as shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'delivered')}>
                              Mark as delivered
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
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
            <div className="border rounded-lg p-4 h-fit bg-background">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
                modifiers={{
                  hasOrders: (date) => {
                    try {
                      const dateStr = format(date, 'yyyy-MM-dd')
                      return !!ordersByDate[dateStr]?.length
                    } catch {
                      return false
                    }
                  }
                }}
                modifiersStyles={{
                  hasOrders: {
                    fontWeight: 'bold',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    borderRadius: '4px'
                  }
                }}
                footer={selectedDate && (
                  <div className="text-sm text-center mt-2">
                    {selectedDateOrders.length} orders on {format(selectedDate, 'MMM d')}
                  </div>
                )}
              />
            </div>

            <div className="flex-1 space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedDate ? (
                    <>
                      Deliveries for {format(selectedDate, 'MMMM d, yyyy')}
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({selectedDateOrders.length} orders)
                      </span>
                    </>
                  ) : (
                    'Select a date to view deliveries'
                  )}
                </h3>

                {selectedDateOrders.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateOrders.map((order) => (
                      <Card key={order.id} className="p-4 hover:bg-accent transition-colors">
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">#{order.orderId}</div>
                                <Badge
                                  variant={
                                    order.status === 'delivered' ? 'default' :
                                    order.status === 'processing' ? 'secondary' :
                                    order.status === 'cancelled' ? 'destructive' :
                                    'outline'
                                  }
                                >
                                  {order.status}
                                </Badge>
                              </div>
                              <div className="text-sm font-medium">{order.customerName}</div>
                              <div className="text-sm text-muted-foreground">{order.deliveryAddress}</div>
                              <div className="text-sm text-muted-foreground">{order.borough}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(order.deliveryDate || order.timestamp), 'h:mm a')}
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="font-medium">${order.total.toFixed(2)}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.items.length} items
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Update Status
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[200px]">
                                <DropdownMenuLabel>Update Order Status</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'processing')}>
                                  Mark as processing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'shipped')}>
                                  Mark as shipped
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'delivered')}>
                                  Mark as delivered
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'cancelled')} className="text-destructive">
                                  Cancel order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsDetailsOpen(true)
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No deliveries scheduled for this date
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {selectedOrder && (
        <OrderDetails
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