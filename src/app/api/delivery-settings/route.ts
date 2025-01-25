import { getAirtableData } from '@/lib/airtable';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const deliveryOrders = await getAirtableData('Delivery Orders', {
      fields: [
        'Order ID',
        'Delivery Date',
        'Customer Name',
        'Address',
        'Borough',
        'Phone',
        'Status',
        'Items',
        'Total',
        'Instructions',
        'Email',
        'ZIP Code',
        'Timestamp'
      ],
      sort: [{ field: 'Timestamp', direction: 'desc' }]
    });

    if (!deliveryOrders) {
      console.error('No delivery orders found');
      return NextResponse.json({
        error: 'No delivery orders found',
        deliveryOrders: []
      }, { status: 200 });
    }

    return NextResponse.json({ deliveryOrders });
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    return NextResponse.json({
      error: 'Failed to fetch delivery orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}