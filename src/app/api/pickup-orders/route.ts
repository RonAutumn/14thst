import { getAirtableData, TABLES } from '@/lib/airtable';
import { NextResponse } from 'next/server';

interface AirtablePickupOrder {
    'Order ID': string;
    'Timestamp': string;
    'Customer Name': string;
    'Email': string;
    'Phone': string;
    'Items': string | Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    'Total': number;
    'Status': string;
    'Pickup Date': string;
}

export async function GET() {
    console.log('Fetching pickup orders...');
    try {
        const pickupOrders = await getAirtableData(TABLES.PICKUP_ORDERS, {
            fields: [
                'Order ID',
                'Timestamp',
                'Customer Name',
                'Email',
                'Phone',
                'Items',
                'Total',
                'Status',
                'Pickup Date'
            ],
            sort: [{ field: 'Pickup Date', direction: 'asc' }]
        }) as unknown as AirtablePickupOrder[];

        console.log(`Found ${pickupOrders?.length || 0} pickup orders`);

        if (!pickupOrders || pickupOrders.length === 0) {
            console.log('No pickup orders found');
            return NextResponse.json({
                orders: []
            });
        }

        // Transform the data with proper date handling
        const transformedOrders = pickupOrders.map((order: AirtablePickupOrder) => {
            try {
                // Parse items
                let parsedItems = [];
                try {
                    parsedItems = typeof order['Items'] === 'string'
                        ? JSON.parse(order['Items'])
                        : Array.isArray(order['Items'])
                            ? order['Items']
                            : [];
                } catch (e) {
                    console.warn(`Error parsing items for order ${order['Order ID']}:`, e);
                }

                // Parse pickup date and time
                const pickupDateTime = order['Pickup Date'] ? new Date(order['Pickup Date']) : null;
                const pickupDate = pickupDateTime ? pickupDateTime.toISOString().split('T')[0] : '';
                const pickupTime = pickupDateTime ? pickupDateTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '';

                return {
                    id: order['Order ID'],
                    orderId: order['Order ID'],
                    customerName: order['Customer Name'] || 'Unknown',
                    email: order['Email'] || '',
                    phone: order['Phone'] || '',
                    items: parsedItems,
                    status: order['Status'] || 'pending',
                    total: Number(order['Total']) || 0,
                    timestamp: order['Timestamp'] || new Date().toISOString(),
                    pickupDate,
                    pickupTime
                };
            } catch (error) {
                console.error(`Error transforming order ${order['Order ID']}:`, error);
                return null;
            }
        }).filter(Boolean);

        console.log(`Successfully transformed ${transformedOrders.length} orders`);
        return NextResponse.json({ orders: transformedOrders });
    } catch (error) {
        console.error('Error fetching pickup orders:', error);
        return NextResponse.json({
            error: 'Failed to fetch pickup orders',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json(
                { error: 'Order ID and status are required' },
                { status: 400 }
            );
        }

        const updatedOrder = await getAirtableData(TABLES.PICKUP_ORDERS, {
            filterByFormula: `{Order ID} = '${id}'`,
            fields: ['Order ID', 'Status']
        });

        if (!updatedOrder || updatedOrder.length === 0) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating pickup order status:', error);
        return NextResponse.json(
            { error: 'Failed to update order status' },
            { status: 500 }
        );
    }
} 