import { NextResponse } from 'next/server'
import {
  createDeliveryOrder,
  createShippingOrder,
  getDeliveryOrders,
  getShippingOrders,
  updateDeliveryOrderStatus,
  updateShippingOrderStatus,
  getFeeByBorough,
  calculateDeliveryFee,
  calculateShippingFee,
  validateDeliveryOrder,
  getAirtableData,
  TABLES
} from '@/lib/airtable'
import { generateOrderId } from '@/lib/utils'
import type { Order } from '@/types/product'
import { logOrderError } from '@/lib/error-logging'
import type { AirtableOrderData } from '@/lib/airtable'
import type { DeliveryOrderData, ShippingOrderData } from '@/features/cart/types'

export async function GET() {
  try {
    // Fetch orders from all tables
    const [deliveryOrders, shippingOrders, pickupOrders] = await Promise.all([
      getAirtableData(TABLES.DELIVERY_ORDERS, {
        fields: ['Order ID', 'Customer Name', 'Items', 'Status', 'Total', 'Timestamp'],
      }),
      getAirtableData(TABLES.SHIPPING_ORDERS, {
        fields: ['Order ID', 'Customer Name', 'Items', 'Status', 'Total', 'Timestamp'],
      }),
      getAirtableData(TABLES.PICKUP_ORDERS, {
        fields: ['Order ID', 'Customer Name', 'Items', 'Status', 'Total', 'Timestamp'],
      })
    ])

    // Format orders
    const formatOrders = (orders: any[], type: string) => orders.map(order => ({
      id: order.id,
      orderId: order['Order ID'],
      customerName: order['Customer Name'],
      items: JSON.parse(order['Items'] || '[]'),
      status: order['Status']?.toLowerCase() || 'pending',
      total: Number(order['Total']) || 0,
      timestamp: order['Timestamp'],
      type
    }))

    // Combine all orders
    const allOrders = [
      ...formatOrders(deliveryOrders, 'delivery'),
      ...formatOrders(shippingOrders, 'shipping'),
      ...formatOrders(pickupOrders, 'pickup')
    ]

    // Sort by timestamp and get the 5 most recent orders
    const recentOrders = allOrders
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)

    return NextResponse.json(recentOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { orderData, orderType, paymentId } = await request.json();

    // Add payment and timestamp info
    const enrichedOrderData = {
      ...orderData,
      'Payment Method': 'card',
      'Status': 'paid',
      'Timestamp': new Date().toISOString(),
      'Order ID': paymentId,
      // Add Type field for Airtable
      'Type': orderType,
      // Format items for Airtable
      'Items': JSON.stringify(orderData.items.map(item => ({
        ...item,
        total: item.price * item.quantity
      })))
    };

    // Create order based on type
    let order;
    switch (orderType) {
      case 'shipping':
        order = await createShippingOrder(enrichedOrderData as ShippingOrderData);
        break;
      case 'pickup':
        order = await createPickupOrder(enrichedOrderData);
        break;
      case 'delivery':
        order = await createDeliveryOrder(enrichedOrderData as DeliveryOrderData);
        break;
      default:
        throw new Error(`Invalid order type: ${orderType}`);
    }

    console.info('Order created successfully:', {
      orderId: order['Order ID'],
      type: orderType,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    let data = await request.json();

    // Remove Type field if it exists
    const { Type, ...dataWithoutType } = data;
    data = dataWithoutType;

    const { orderId, status } = data;

    // Validate required fields
    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Determine order type from the data structure
    const isDelivery = Boolean(data['Borough']);
    const isShipping = Boolean(data['State']);

    // Validate that it's either delivery or shipping, but not both
    if (!isDelivery && !isShipping) {
      return NextResponse.json(
        { error: 'Missing required fields: either Borough (for delivery) or State (for shipping) must be provided' },
        { status: 400 }
      );
    }

    if (isDelivery && isShipping) {
      return NextResponse.json(
        { error: 'Invalid order data: cannot specify both Borough and State' },
        { status: 400 }
      );
    }

    // Update status based on order type
    if (isDelivery) {
      await updateDeliveryOrderStatus(orderId, status);
    } else {
      await updateShippingOrderStatus(orderId, status);
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating order status:', error);

    // Create structured error response
    const errorResponse = {
      error: error instanceof Error ? error.message : 'Failed to update order status',
      code: 'UPDATE_ERROR',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? {
        name: error.name,
        cause: error.cause,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : undefined
    };

    // Log the error to Airtable
    try {
      await fetch('/api/log/order-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorResponse)
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
} 