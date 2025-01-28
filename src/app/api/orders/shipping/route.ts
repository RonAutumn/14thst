import { NextResponse } from 'next/server';
import { base } from '@/lib/airtable';
import { TABLES } from '@/lib/constants';
import { logOrderError } from '@/lib/error-logging';
import type { ShippingOrderData } from '@/features/cart/types';
import { createShippingOrder, getShippingOrders, updateShippingOrderStatus, verifyAirtableConnection } from '@/lib/airtable';
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Fetch all shipping orders from Airtable
    const records = await base(TABLES.SHIPPING_ORDERS)
      .select({
        sort: [{ field: 'Timestamp', direction: 'desc' }],
        filterByFormula: "Status != 'cancelled'"
      })
      .all();

    console.log('Raw Airtable records:', records);

    // Format the orders
    const formattedOrders = records.map(record => {
      const fields = record.fields;
      console.log('Processing record:', fields);

      return {
        id: record.id,
        orderId: fields['Order ID'] || record.id,
        customerName: fields['Customer Name'] || 'Unknown',
        email: fields['Email'] || '',
        status: fields['Status'] || 'pending',
        shippingMethod: fields['Shipping Method'] || 'Standard Shipping',
        shippingFee: parseFloat(fields['Shipping Fee']?.toString() || '0'),
        total: parseFloat(fields['Total']?.toString() || '0'),
        items: typeof fields['Items'] === 'string'
          ? JSON.parse(fields['Items'])
          : fields['Items'] || [],
        address: fields['Address'] || '',
        city: fields['City'] || '',
        state: fields['State'] || '',
        zipCode: fields['Zip Code'] || '',
        phone: fields['Phone'] || '',
        trackingNumber: fields['Tracking Number'] || '',
        createdAt: fields['Timestamp'] || new Date().toISOString()
      };
    });

    console.log('Formatted orders:', formattedOrders);
    return NextResponse.json(formattedOrders);
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
    const record = await base(TABLES.SHIPPING_ORDERS).create([{
      fields: {
        'Shipping Address': shippingAddress,
        'City': shippingCity,
        'Timestamp': new Date().toISOString(),
        'Customer Name': name,
        'Email': email,
        'Items': JSON.stringify(items),
        'Order ID': orderId,
        'Payment Method': paymentMethod,
        'Phone': phone,
        'State': shippingState,
        'Status': 'pending',
        'Zip Code': shippingZip
      }
    }]);

    // Log successful order creation
    console.info('Shipping order created successfully:', {
      orderId: orderId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, recordId: record[0].id });
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

    // Update the order status in Airtable
    const record = await base(TABLES.SHIPPING_ORDERS).update(id, {
      'Status': status
    });

    return NextResponse.json({
      success: true,
      order: {
        id: record.id,
        status: record.fields['Status']
      }
    });
  } catch (error) {
    console.error('Error updating shipping order status:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping order status' },
      { status: 500 }
    );
  }
} 