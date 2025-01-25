import { getAirtableData, TABLES } from '@/lib/airtable';
import { NextResponse } from 'next/server';

interface AirtableOrder {
    'Order ID': string;
    'Delivery Date': string;
    'Customer Name': string;
    'Address': string;
    'Borough': string;
    'Phone': string;
    'Status': string;
    'Items': string | Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    'Total': number;
    'Instructions': string;
    'Email': string;
    'ZIP Code': string;
    'Timestamp': string;
}

export async function GET() {
    console.log('Fetching delivery orders...');
    try {
        const deliveryOrders = await getAirtableData(TABLES.DELIVERY_ORDERS, {
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
            sort: [{ field: 'Delivery Date', direction: 'desc' }]
        }) as unknown as AirtableOrder[];

        console.log(`Found ${deliveryOrders?.length || 0} delivery orders`);

        if (!deliveryOrders || deliveryOrders.length === 0) {
            console.log('No delivery orders found');
            return NextResponse.json({
                orders: []
            });
        }

        // Transform the data with proper date handling
        const transformedOrders = deliveryOrders.map((order: AirtableOrder) => {
            try {
                // Parse and validate delivery date
                const deliveryDate = order['Delivery Date'] ? new Date(order['Delivery Date']) : null;
                if (deliveryDate && isNaN(deliveryDate.getTime())) {
                    console.warn(`Invalid delivery date for order ${order['Order ID']}: ${order['Delivery Date']}`);
                }

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

                return {
                    id: order['Order ID'],
                    orderId: order['Order ID'],
                    customerName: order['Customer Name'] || 'Unknown',
                    deliveryDate: deliveryDate ? deliveryDate.toISOString() : null,
                    status: order['Status'] || 'pending',
                    total: Number(order['Total']) || 0,
                    items: parsedItems,
                    deliveryAddress: order['Address'] || '',
                    borough: order['Borough'] || '',
                    email: order['Email'] || '',
                    phone: order['Phone'] || '',
                    instructions: order['Instructions'] || '',
                    timestamp: order['Timestamp'] || new Date().toISOString()
                };
            } catch (error) {
                console.error(`Error transforming order ${order['Order ID']}:`, error);
                return null;
            }
        }).filter(Boolean);

        console.log(`Successfully transformed ${transformedOrders.length} orders`);
        return NextResponse.json({ orders: transformedOrders });
    } catch (error) {
        console.error('Error fetching delivery orders:', error);
        return NextResponse.json({
            error: 'Failed to fetch delivery orders',
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

        const updatedOrder = await getAirtableData('Delivery Orders', {
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
        console.error('Error updating delivery order status:', error);
        return NextResponse.json(
            { error: 'Failed to update order status' },
            { status: 500 }
        );
    }
}
