import { NextResponse } from 'next/server';
import { createShippingOrder, getShippingOrders, updateShippingOrderStatus, verifyAirtableConnection } from '@/lib/airtable';
import { logOrderError } from '@/lib/error-logging';
import type { ShippingOrderData } from '@/features/cart/types';
import { base } from '@/lib/airtable';
import { TABLES } from '@/lib/constants';

export async function GET() {
  try {
    const orders = await getShippingOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching shipping orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      name,
      email,
      phone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      items,
      orderId,
      paymentMethod = 'pending'
    } = data;

    // Create the shipping order in Airtable
    const record = await base(TABLES.SHIPPING_ORDERS).create({
      fields: {
        'Address': shippingAddress,
        'City': shippingCity,
        'Created Time': new Date().toISOString(),
        'Customer Name': name,
        'Email': email,
        'Items': JSON.stringify(items),
        'Order ID': orderId,
        'Payment Method': paymentMethod,
        'Phone': phone,
        'State': shippingState,
        'Status': 'pending',
        'Timestamp': new Date().toISOString(),
        'Zip Code': shippingZip
      }
    });

    // Log successful order creation
    console.info('Shipping order created successfully:', {
      orderId: orderId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, recordId: record.id });
  } catch (error) {
    // Log the error with context
    const errorContext = {
      endpoint: 'orders/shipping',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        cause: error.cause,
      } : 'Unknown error'
    };

    logOrderError(
      error instanceof Error ? error : new Error('Unknown error occurred'),
      errorContext
    );

    console.error('Error creating shipping order:', error);

    return NextResponse.json(
      { error: 'Failed to create shipping order' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const order = await updateShippingOrderStatus(id, status);
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating shipping order status:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping order status' },
      { status: 500 }
    );
  }
} 