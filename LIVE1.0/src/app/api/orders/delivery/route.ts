import { NextResponse } from 'next/server';
import { base, TABLES } from '@/lib/airtable';
import { logOrderError } from '@/lib/error-logging';
import type { DeliveryOrder } from '@/types/orders';
import type { CartItem } from '@/features/cart/types';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      name,
      email,
      phone,
      address,
      zipCode,
      borough,
      instructions,
      deliveryDate,
      deliveryTime,
      items,
      total,
      deliveryFee,
      orderId,
      paymentMethod = 'card'
    } = data;

    // Create the delivery order in Airtable
    const record = await base(TABLES.DELIVERY_ORDERS).create([
      {
        fields: {
          'Address': address,
          'Borough': borough,
          'Customer Name': name,
          'Delivery Date': deliveryDate,
          'Delivery Fee': deliveryFee,
          'Email': email,
          'Instructions': instructions || '',
          'Items': JSON.stringify(items),
          'Order ID': orderId,
          'Payment Method': paymentMethod,
          'Phone': phone,
          'Status': 'pending',
          'Total': total,
          'ZIP Code': zipCode,
          'Delivery Time': deliveryTime
        }
      }
    ]);

    // Log successful order creation
    console.info('Delivery order created successfully:', {
      orderId: orderId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, recordId: record[0].id });
  } catch (error) {
    // Log the error with context
    const errorContext = {
      endpoint: 'orders/delivery',
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

    console.error('Error creating delivery order:', error);

    return NextResponse.json(
      { error: 'Failed to create delivery order' },
      { status: 500 }
    );
  }
}
