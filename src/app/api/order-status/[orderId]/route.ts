import { NextResponse } from 'next/server';
import { base, TABLES } from '@/lib/airtable';

export async function GET(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const orderId = params.orderId;

        if (!orderId) {
            return NextResponse.json(
                { error: 'Missing order ID' },
                { status: 400 }
            );
        }

        // Try to find the order in each possible table
        const tables = [TABLES.PICKUP_ORDERS, TABLES.DELIVERY_ORDERS, TABLES.SHIPPING_ORDERS];
        let order = null;
        let foundTable = null;

        for (const tableName of tables) {
            try {
                const records = await base(tableName).select({
                    filterByFormula: `{Order ID} = '${orderId}'`,
                    maxRecords: 1
                }).firstPage();

                if (records && records.length > 0) {
                    order = {
                        id: records[0].id,
                        ...records[0].fields
                    };
                    foundTable = tableName;
                    break;
                }
            } catch (error) {
                console.error(`Error checking ${tableName}:`, error);
                // Continue checking other tables
            }
        }

        if (!order || !foundTable) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error processing order status:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve order status' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const orderId = params.orderId;
        const { status } = await request.json();

        if (!orderId || !status) {
            return NextResponse.json(
                { error: 'Order ID and status are required' },
                { status: 400 }
            );
        }

        // Try to find and update the order in each possible table
        const tables = [TABLES.PICKUP_ORDERS, TABLES.DELIVERY_ORDERS, TABLES.SHIPPING_ORDERS];
        let updatedOrder = null;
        let foundTable = null;

        for (const tableName of tables) {
            try {
                const records = await base(tableName).select({
                    filterByFormula: `{Order ID} = '${orderId}'`,
                    maxRecords: 1
                }).firstPage();

                if (records && records.length > 0) {
                    const record = records[0];
                    await base(tableName).update([{
                        id: record.id,
                        fields: {
                            'Status': status,
                            'Last Updated': new Date().toISOString()
                        }
                    }]);

                    // Fetch the updated record
                    const updatedRecords = await base(tableName).select({
                        filterByFormula: `{Order ID} = '${orderId}'`,
                        maxRecords: 1
                    }).firstPage();

                    if (updatedRecords && updatedRecords.length > 0) {
                        updatedOrder = {
                            id: updatedRecords[0].id,
                            ...updatedRecords[0].fields
                        };
                    }

                    foundTable = tableName;
                    break;
                }
            } catch (error) {
                console.error(`Error updating ${tableName}:`, error);
                // Continue checking other tables
            }
        }

        if (!updatedOrder || !foundTable) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json(
            { error: 'Failed to update order status' },
            { status: 500 }
        );
    }
} 