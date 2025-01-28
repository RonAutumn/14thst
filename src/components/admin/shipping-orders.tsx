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
import { LoadingSkeleton } from "@/components/admin/loading-skeleton"
import { toast } from "sonner"
import { OrderStatus, ShippingOrder, RawOrderData } from "@/types/orders"

type SortField = 'orderId' | 'timestamp' | 'total'
type SortDirection = 'asc' | 'desc'

// Add ErrorBoundary component
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 rounded-md bg-red-50 border border-red-200">
      <h2 className="text-lg font-semibold text-red-800">Something went wrong:</h2>
      <pre className="mt-2 text-sm text-red-600">{error.message}</pre>
    </div>
  );
}

export function ShippingOrders() {
  const [orders, setOrders] = useState<ShippingOrder[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    console.log('🔄 Component mounted, fetching data...')
    fetchData()
  }, [])

  const fetchData = async () => {
    console.log('📡 Starting data fetch...')
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔍 Fetching orders...')
      
      const ordersRes = await fetch('/api/shipping-orders')
      if (!ordersRes.ok) {
        throw new Error(`Failed to fetch orders: ${ordersRes.status} ${ordersRes.statusText}`)
      }

      const ordersData = await ordersRes.json()
      console.log('📦 Raw orders data:', ordersData)

      if (!ordersData.orders || !Array.isArray(ordersData.orders)) {
        console.error('❌ No orders array in response:', ordersData)
        setOrders([])
        return
      }

      const validatedOrders = ordersData.orders.map((order: RawOrderData): ShippingOrder => {
        console.log('Validating order:', order);
        
        // Parse items if they're stored as a string
        let parsedItems;
        try {
          parsedItems = typeof order['Items'] === 'string' ? JSON.parse(order['Items']) : order['Items'];
        } catch (error) {
          console.error(`Error parsing items for order ${order['Order ID']}:`, error);
          parsedItems = [];
        }

        return {
          id: order['Order ID'] || 'unknown',
          orderId: order['Order ID'] || 'unknown',
          customerName: order['Customer Name'] || 'Unknown Customer',
          email: order['Email'] || '',
          phone: order['Phone'] || '',
          address: order['Address'] || '',
          items: parsedItems,
          status: order['Status'] || 'pending',
          total: typeof order['Total'] === 'number' ? order['Total'] : 0,
          timestamp: order['Timestamp'] || new Date().toISOString(),
          shippingMethod: order['Shipping Method'] || 'No shipping method selected',
          city: order['City'] || '',
          state: order['State'] || '',
          zipCode: order['Zip Code'] || '',
          address2: order.address2 || '',
          apartment: order.apartment || '',
          shippingFee: typeof order['Shipping Fee'] === 'number' ? order['Shipping Fee'] : 0
        }
      })

      console.log('✅ Validated orders:', validatedOrders)
      setOrders(validatedOrders)

    } catch (error) {
      console.error('❌ Error in fetchData:', error)
      setError(error instanceof Error ? error : new Error('Failed to fetch orders'))
      toast.error('Failed to fetch orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/shipping-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error('Failed to update status')
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
      
      return Promise.resolve()
    } catch (error) {
      console.error('Error updating status:', error)
      return Promise.reject(error)
    }
  }

  const sortOrders = (a: ShippingOrder, b: ShippingOrder) => {
    const direction = sortDirection === 'asc' ? 1 : -1
    
    switch (sortField) {
      case 'orderId':
        return direction * (a.orderId || '').localeCompare(b.orderId || '')
      case 'timestamp':
        return direction * (new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime())
      case 'total':
        return direction * ((a.total || 0) - (b.total || 0))
      default:
        return 0
    }
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  if (error) {
    return <ErrorFallback error={error} />
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Shipping Orders</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="max-w-sm pl-8"
                type="search"
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('orderId')} className="cursor-pointer">
                Order ID {sortField === 'orderId' && <ArrowUpDown className="inline w-4 h-4" />}
              </TableHead>
              <TableHead onClick={() => handleSort('timestamp')} className="cursor-pointer">
                Date {sortField === 'timestamp' && <ArrowUpDown className="inline w-4 h-4" />}
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Shipping Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead onClick={() => handleSort('total')} className="cursor-pointer">
                Total {sortField === 'total' && <ArrowUpDown className="inline w-4 h-4" />}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.sort(sortOrders).map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.orderId}</TableCell>
                  <TableCell>{order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">{order.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.address}</p>
                      {order.address2 && <p className="text-sm">{order.address2}</p>}
                      {order.apartment && <p className="text-sm">Apt/Unit: {order.apartment}</p>}
                      <p className="text-sm text-muted-foreground">
                        {order.city}, {order.state} {order.zipCode}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === 'delivered' ? 'default' :
                        order.status === 'processing' ? 'secondary' :
                        order.status === 'cancelled' ? 'destructive' :
                        'outline'
                      }
                    >
                      {order.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>${(order.total || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsDetailsOpen(true)
                          }}
                        >
                          View details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No shipping orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}
