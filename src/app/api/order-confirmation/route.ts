import { NextResponse } from 'next/server';
import { createDeliveryOrder, createShippingOrder, createPickupOrder } from '@/lib/airtable';
import type { DeliveryOrderData, ShippingOrderData, PickupOrderData } from '@/features/cart/types';

export async function POST(request: Request) {
    try {
        const { orderId, orderData, sessionId } = await request.json();

        if (!orderId || !orderData) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create record in Airtable based on order type
        let order;
        switch (orderData.orderType) {
            case 'delivery':
                order = await createDeliveryOrder(orderData as DeliveryOrderData);
                break;
            case 'shipping':
                order = await createShippingOrder(orderData as ShippingOrderData);
                break;
            case 'pickup':
                const pickupData: PickupOrderData = {
                    ...orderData,
                    customerName: `${orderData.firstName} ${orderData.lastName}`,
                    orderId,
                    status: 'pending'
                };
                order = await createPickupOrder(pickupData);
                break;
            default:
                throw new Error(`Invalid order type: ${orderData.orderType}`);
        }

        return NextResponse.json({
            success: true,
            orderId: order.orderId,
            message: 'Order created successfully'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            {
                error: 'Failed to create order',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 