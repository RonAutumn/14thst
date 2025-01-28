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
import { Order, OrderStatus, ShippingOrder } from "@/types/orders"
import { ShippingRate } from "@/types/shipstation"
import { Loader2, Package, Truck } from "lucide-react"

interface OrderDetailsProps {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus) => Promise<void>
  onBulkLabelCreate?: (orders: string[]) => Promise<void>
  selectedOrders?: string[]
  onOrderSelect?: (orderId: string, selected: boolean) => void
  isSelected?: boolean
}

interface ShippingRateDisplay {
  id: string;
  name: string;
  rate: number;
  transitDays: number;
  carrier: string;
}

const ORDER_STATUSES: { value: OrderStatus; label: string; variant: "default" | "secondary" | "destructive" | "outline" }[] = [
  { value: 'pending', label: 'Pending', variant: 'outline' },
  { value: 'processing', label: 'Processing', variant: 'secondary' },
  { value: 'shipped', label: 'Shipped', variant: 'default' },
  { value: 'delivered', label: 'Delivered', variant: 'default' },
  { value: 'cancelled', label: 'Cancelled', variant: 'destructive' },
]

export function OrderDetails({ 
  order, 
  open, 
  onOpenChange, 
  onStatusUpdate,
  onBulkLabelCreate,
  selectedOrders,
  onOrderSelect,
  isSelected 
}: OrderDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status || 'pending')
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [shippingRates, setShippingRates] = useState<ShippingRateDisplay[]>([])
  const [selectedRate, setSelectedRate] = useState<string>('')
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [customerShippingMethod, setCustomerShippingMethod] = useState<string>('')
  const [customerShippingFee, setCustomerShippingFee] = useState<number>(0)

  useEffect(() => {
    setCurrentStatus(order.status || 'pending')
    setTrackingNumber(order.trackingNumber || '')
    if (open) {
      fetchShippingRates()
      // Set customer's chosen shipping method and fee
      const shippingOrder = order as ShippingOrder
      if (shippingOrder.shippingMethod) {
        setCustomerShippingMethod(shippingOrder.shippingMethod)
        // Parse shipping fee with better error handling
        let fee = 0
        try {
          fee = typeof shippingOrder.shippingFee === 'string' 
            ? parseFloat(shippingOrder.shippingFee) 
            : typeof shippingOrder.shippingFee === 'number'
              ? shippingOrder.shippingFee
              : 0
        } catch (e) {
          console.error('Error parsing shipping fee:', e)
        }
        setCustomerShippingFee(isNaN(fee) ? 0 : fee)
      }
    }
  }, [order, open])

  // Helper function to format price
  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '0.00'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
  }

  // Update the shipping rates formatting
  const formatRates = (rates: any[]): ShippingRateDisplay[] => {
    return rates.map(rate => ({
      id: rate.serviceCode || rate.id || '',
      name: rate.serviceName || rate.name || 'Unknown Service',
      rate: parseFloat(formatPrice(rate.price || rate.shipmentCost)),
      transitDays: parseInt(String(rate.estimatedDays || rate.transitDays)) || 0,
      carrier: rate.carrier?.toLowerCase() || 'unknown'
    }))
  }

  const fetchShippingRates = async () => {
    try {
      setIsLoadingRates(true)
      
      // Map items to only include shipping-relevant information
      const items = (typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item) => ({
        quantity: item.quantity || 1,
        weight: 1  // Default weight in ounces
      }));

      // Get full address from order
      const shippingOrder = order as ShippingOrder;
      const fullAddress = [
        shippingOrder.address,
        shippingOrder.address2, // Add support for address line 2 if it exists
        shippingOrder.apartment, // Add support for apartment/unit if it exists
      ].filter(Boolean).join(' ');

      const response = await fetch(`/api/shipping/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: order.customerName,
          email: order.email,
          address: fullAddress,
          city: shippingOrder.city,
          state: shippingOrder.state,
          zipCode: shippingOrder.zipCode,
          items: items,
          shippingMethod: shippingOrder.shippingMethod,
          preferredCarrier: shippingOrder.shippingMethod?.toLowerCase().includes('usps') ? 'usps' : 'ups'
        })
      })
      if (!response.ok) throw new Error('Failed to fetch shipping rates')
      const data = await response.json()
      
      // Format rates with the new helper function
      const formattedRates = formatRates([...(data.rates.usps || []), ...(data.rates.ups || [])])
      setShippingRates(formattedRates)
      
      // Auto-select the rate that matches the customer's chosen method
      if ((order as ShippingOrder).shippingMethod && formattedRates.length > 0) {
        const matchingRate = formattedRates.find(rate => 
          rate.name.toLowerCase().includes((order as ShippingOrder).shippingMethod.toLowerCase())
        )
        console.log('Matching rate found:', matchingRate)
        if (matchingRate) {
          setSelectedRate(matchingRate.id)
          // Update the customer's shipping fee if it's not set
          if (!customerShippingFee) {
            setCustomerShippingFee(matchingRate.rate)
          }
        }
      }
    } catch (error) {
      toast.error('Failed to fetch shipping rates')
      console.error('Error fetching rates:', error)
    } finally {
      setIsLoadingRates(false)
    }
  }

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
        body: JSON.stringify({ 
          trackingNumber,
          shippingMethod 
        }),
      })
      if (!response.ok) throw new Error('Failed to update tracking number')
      toast.success('Tracking number updated successfully')
    } catch (error) {
      toast.error('Failed to update tracking number')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCreateLabel = async () => {
    if (!selectedRate) {
      toast.error('Please select a shipping rate first')
      return
    }

    // Validate required shipping address fields
    if (!(order as ShippingOrder).address) {
      toast.error('Shipping address is required')
      return
    }

    if (!(order as ShippingOrder).zipCode) {
      toast.error('ZIP code is required')
      return
    }

    try {
      setIsCreatingLabel(true)
      
      // Get the selected rate details
      const selectedRateDetails = shippingRates.find(rate => rate.id === selectedRate)
      if (!selectedRateDetails) {
        throw new Error('Selected rate not found')
      }

      // Map items to only include shipping-relevant information
      const items = (typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item) => ({
        quantity: item.quantity || 1,
        weight: {
          value: 1,
          units: 'ounces'
        }
      }));

      // Calculate total weight
      const totalWeight = items.reduce((sum, item) => sum + (item.weight.value * item.quantity), 0);

      // Log shipping details for debugging
      console.log('Shipping details:', {
        address: {
          address: (order as ShippingOrder).address,
          city: (order as ShippingOrder).city,
          state: (order as ShippingOrder).state,
          zipCode: (order as ShippingOrder).zipCode
        },
        totalWeight,
        items
      });

      const response = await fetch(`/api/shipping/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.id,
          customerName: order.customerName,
          customerEmail: order.email,
          rateId: selectedRate,
          serviceCode: selectedRateDetails.name,
          carrierCode: selectedRateDetails.carrier,
          shipTo: {
            name: order.customerName,
            street1: [
              (order as ShippingOrder).address,
              (order as ShippingOrder).address2,
              (order as ShippingOrder).apartment ? `Apt/Unit: ${(order as ShippingOrder).apartment}` : null
            ].filter(Boolean).join(' ') || undefined,
            city: (order as ShippingOrder).city || '',
            state: (order as ShippingOrder).state || '',
            postalCode: (order as ShippingOrder).zipCode || '',
            country: 'US',
            phone: order.phone || ''
          },
          items: items
        })
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create shipping label');
      }
      
      const data = await response.json()
      // Update tracking number if provided
      if (data.trackingNumber) {
        setTrackingNumber(data.trackingNumber)
      }
      
      // Open label in new window if URL provided
      if (data.labelUrl) {
        window.open(data.labelUrl, '_blank')
      }
      
      // Update order status to processing if pending
      if (currentStatus === 'pending') {
        await handleStatusUpdate('processing')
      }
      
      toast.success('Shipping label created successfully')
    } catch (error) {
      console.error('Error creating label:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create shipping label')
    } finally {
      setIsCreatingLabel(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>Order Details - #{order.orderId}</span>
            {onOrderSelect && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onOrderSelect(order.id, e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-normal">Select for bulk label creation</span>
              </div>
            )}
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

            {/* Customer's Chosen Shipping Method */}
            <div className="mt-4 mb-4 p-4 border rounded-lg bg-muted/10">
              <h3 className="font-semibold mb-2">Customer's Chosen Shipping Method</h3>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="font-medium">{customerShippingMethod}</span>
                <span className="text-muted-foreground ml-2">
                  (Paid: ${formatPrice(customerShippingFee)})
                </span>
              </div>
            </div>

            {/* Shipping Rates Section */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Available Shipping Options</h3>
              {isLoadingRates ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading rates...</span>
                </div>
              ) : shippingRates.length > 0 ? (
                <div className="space-y-4">
                  <Select value={selectedRate} onValueChange={setSelectedRate}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select shipping method" />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingRates.map((rate) => (
                        <SelectItem key={rate.id} value={rate.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{rate.name}</span>
                            <span className="text-muted-foreground font-medium ml-2">
                              ${formatPrice(rate.rate)} - {rate.transitDays > 0 ? `${rate.transitDays} days` : 'N/A'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full mt-4"
                    onClick={handleCreateLabel}
                    disabled={!selectedRate || isCreatingLabel}
                  >
                    {isCreatingLabel ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Label...
                      </>
                    ) : (
                      'Create Shipping Label'
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No shipping rates available</p>
              )}
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
                <span className="text-sm text-muted-foreground">Shipping Address:</span>
                <p>{(order as ShippingOrder).address}</p>
                {(order as ShippingOrder).address2 && <p>{(order as ShippingOrder).address2}</p>}
                {(order as ShippingOrder).apartment && <p>Apt/Unit: {(order as ShippingOrder).apartment}</p>}
                <div className="flex items-center gap-2">
                  <p>
                    {(order as ShippingOrder).city}, {(order as ShippingOrder).state} {(order as ShippingOrder).zipCode}
                  </p>
                </div>
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

// Add new component for bulk actions
interface BulkActionsProps {
  selectedOrders: string[]
  onCreateLabels: () => Promise<void>
  isCreating: boolean
}

export function BulkActions({ selectedOrders, onCreateLabels, isCreating }: BulkActionsProps) {
  if (selectedOrders.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedOrders.length} orders selected
        </span>
        <Button
          onClick={onCreateLabels}
          disabled={isCreating}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Labels...
            </>
          ) : (
            <>
              <Package className="mr-2 h-4 w-4" />
              Create All Labels
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 