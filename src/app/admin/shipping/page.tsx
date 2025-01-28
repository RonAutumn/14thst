"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSkeleton } from "@/components/admin/loading-skeleton"
import { AdminHeader } from "@/components/admin/header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Package } from "lucide-react"
import { OrderDetails, BulkActions } from "@/components/admin/order-details"
import { DataTable } from "@/components/ui/data-table"
import { toast } from "sonner"
import { Order, OrderStatus } from "@/types/orders"
import { ColumnDef } from "@tanstack/react-table"

export default function ShippingPage() {
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isCreatingBulkLabels, setIsCreatingBulkLabels] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      console.log('Fetching orders...')
      
      const response = await fetch('/api/orders/shipping', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Raw API response:', data)

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to fetch orders')
      }

      if (!Array.isArray(data)) {
        console.error('Expected array of orders but got:', typeof data)
        throw new Error('Invalid data format received from server')
      }

      // Ensure data is properly formatted
      const formattedOrders = data.map((order: any) => {
        console.log('Processing order:', order)
        try {
          return {
            id: order.id || '',
            orderId: order.orderId || order.id || '',
            customerName: order.customerName || 'Unknown',
            email: order.email || '',
            status: order.status || 'pending',
            shippingMethod: order.shippingMethod || 'Standard Shipping',
            shippingFee: typeof order.shippingFee === 'number' 
              ? order.shippingFee 
              : parseFloat(order.shippingFee || '0'),
            total: typeof order.total === 'number'
              ? order.total
              : parseFloat(order.total || '0'),
            items: typeof order.items === 'string' 
              ? JSON.parse(order.items) 
              : Array.isArray(order.items)
                ? order.items
                : [],
            address: order.address || '',
            city: order.city || '',
            state: order.state || '',
            zipCode: order.zipCode || '',
            phone: order.phone || '',
            trackingNumber: order.trackingNumber || ''
          }
        } catch (err) {
          console.error('Error processing order:', order, err)
          return null
        }
      }).filter(Boolean) // Remove any null values from failed processing

      console.log('Formatted orders:', formattedOrders)
      setOrders(formattedOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError(error instanceof Error ? error.message : 'Failed to load orders')
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  // Add debug log for orders state changes
  useEffect(() => {
    console.log('Current orders state:', orders)
  }, [orders])

  const handleOrderSelect = (orderId: string, selected: boolean) => {
    setSelectedOrders(prev => 
      selected 
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    )
  }

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')
      
      // Update orders list
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      )

      toast.success('Order status updated successfully')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update order status')
    }
  }

  const handleBulkLabelCreate = async () => {
    if (selectedOrders.length === 0) {
      toast.error('No orders selected')
      return
    }

    try {
      setIsCreatingBulkLabels(true)
      
      const response = await fetch('/api/shipping/labels/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrders })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create labels')
      }

      const result = await response.json()

      if (result.success > 0) {
        toast.success(`Successfully created ${result.success} shipping labels`)
      }
      
      if (result.failed > 0) {
        toast.error(`Failed to create ${result.failed} shipping labels`)
      }

      // Refresh orders to get updated statuses
      fetchOrders()
      
      // Clear selections
      setSelectedOrders([])
      
    } catch (error) {
      console.error('Error creating bulk labels:', error)
      toast.error('Failed to create shipping labels')
    } finally {
      setIsCreatingBulkLabels(false)
    }
  }

  const columns: ColumnDef<Order>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="w-4 h-4"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => {
            row.toggleSelected(!!e.target.checked)
            handleOrderSelect(row.original.id, e.target.checked)
          }}
          className="w-4 h-4"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "orderId",
      header: "Order ID",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedOrder(row.original)}
          className="text-primary hover:underline"
        >
          #{row.getValue("orderId")}
        </button>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === 'delivered' ? 'default' :
          row.original.status === 'processing' ? 'secondary' :
          row.original.status === 'cancelled' ? 'destructive' :
          'outline'
        }>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "shippingMethod",
      header: "Shipping Method",
      cell: ({ row }) => {
        const order = row.original as ShippingOrder
        return (
          <div className="flex flex-col">
            <span>{order.shippingMethod}</span>
            <span className="text-sm text-muted-foreground">
              ${Number(order.shippingFee).toFixed(2)}
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>${row.original.total.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">
            {(typeof row.original.items === 'string' 
              ? JSON.parse(row.original.items) 
              : row.original.items).length} items
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedOrder(row.original)}
            className="text-sm text-primary hover:underline"
          >
            View Details
          </button>
          {row.original.status === 'pending' && (
            <button
              onClick={() => setSelectedOrder(row.original)}
              className="text-sm text-primary hover:underline"
            >
              Create Label
            </button>
          )}
        </div>
      ),
    },
  ]

  if (loading) return <LoadingSkeleton />

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AdminHeader
        title="Shipping Management"
        description="Manage shipping orders and track shipments"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        <DataTable
          columns={columns}
          data={orders}
        />
      </Card>

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          onOrderSelect={handleOrderSelect}
          isSelected={selectedOrders.includes(selectedOrder.id)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      <BulkActions
        selectedOrders={selectedOrders}
        onCreateLabels={handleBulkLabelCreate}
        isCreating={isCreatingBulkLabels}
      />
    </div>
  )
} 