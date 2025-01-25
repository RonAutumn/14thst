import { getAirtableData, updateAirtableRecord, base } from '@/lib/airtable';
import { NextResponse } from 'next/server';
import { createShipment, getShippingRates, createShippingLabel } from '@/lib/shipstation';
import type { AirtableShippingOrder } from '@/types/airtable';
import type { ShipmentDetails } from '@/types/shipstation';
import { TABLES } from '@/lib/constants';

export async function GET() {
    console.log('🚀 Fetching shipping orders...');

    try {
        console.log('📫 Calling Airtable API...');
        const shippingOrders = await getAirtableData('Shipping Orders', {
            fields: [
                'Order ID',
                'Customer Name',
                'Email',
                'Phone',
                'Address',
                'City',
                'State',
                'Zip Code',
                'Items',
                'Payment Method',
                'Timestamp',
                'Shipment ID',
                'Tracking Number',
                'Label URL',
                'Status'
            ],
            sort: [{ field: 'Timestamp', direction: 'desc' }]
        }) as unknown as AirtableShippingOrder[];

        console.log('📦 Raw Airtable response:', JSON.stringify(shippingOrders, null, 2));

        if (!shippingOrders) {
            console.log('❌ No shipping orders found');
            return NextResponse.json({
                error: 'No shipping orders found',
                orders: []
            });
        }

        console.log(`✅ Found ${shippingOrders.length} shipping orders`);

        // Transform Airtable data to match our frontend interface
        const transformedOrders = shippingOrders.map(order => {
            console.log(`🔄 Transforming order ${order['Order ID']}`);
            return {
                id: order['Order ID'],
                orderId: order['Order ID'],
                customerName: order['Customer Name'] || '',
                email: order['Email'] || '',
                phone: order['Phone'] || '',
                items: order['Items'] || [],
                status: order['Status'] || 'pending',
                total: 0, // Will be calculated in the frontend
                timestamp: order['Timestamp'] || '',
                method: 'shipping' as const,
                deliveryAddress: `${order['Address'] || ''}, ${order['City'] || ''}, ${order['State'] || ''} ${order['Zip Code'] || ''}`,
                borough: order['City'] || '',
                shipmentId: order['Shipment ID'] || '',
                trackingNumber: order['Tracking Number'] || '',
                labelUrl: order['Label URL'] || ''
            };
        });

        console.log('✨ Transformed orders:', JSON.stringify(transformedOrders, null, 2));
        return NextResponse.json({ orders: transformedOrders });
    } catch (error) {
        console.error('❌ Error fetching shipping orders:', error);
        return NextResponse.json({ error: 'Failed to fetch shipping orders' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, shipmentId, trackingNumber, labelUrl, status } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const updateData: Partial<AirtableShippingOrder> = {
            'Status': status
        };

        if (shipmentId) {
            updateData['Shipment ID'] = shipmentId;
        }
        if (trackingNumber) {
            updateData['Tracking Number'] = trackingNumber;
        }
        if (labelUrl) {
            updateData['Label URL'] = labelUrl;
        }

        await updateAirtableRecord('Shipping Orders', id, updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Error updating shipping order:', error);
        return NextResponse.json({ error: 'Failed to update shipping order' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Create shipment in ShipStation with the selected rate
        const shipmentDetails: ShipmentDetails = {
            orderId: data.orderId,
            orderNumber: data.orderId,
            customerName: data.name,
            customerEmail: data.email,
            address: {
                street1: data.shippingAddress,
                city: data.shippingCity,
                state: data.shippingState,
                postalCode: data.shippingZip,
                country: 'US'
            },
            items: data.items.map((item: any) => ({
                sku: item.id,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.price
            }))
        };

        // Create shipment in ShipStation
        const shipmentResponse = await createShipment(shipmentDetails);

        // Create shipping label using the selected rate
        if (data.selectedRate) {
            const label = await createShippingLabel(shipmentResponse.shipmentId, data.selectedRate.id);

            // Update data with shipping information
            data.shipmentId = shipmentResponse.shipmentId;
            data.trackingNumber = label.trackingNumber;
            data.labelUrl = label.labelUrl;
        }

        // Create record in Airtable
        const record = await base(TABLES.SHIPPING_ORDERS).create([{
            fields: {
                'Order ID': data.orderId,
                'Customer Name': data.name,
                'Email': data.email,
                'Phone': data.phone,
                'Address': data.shippingAddress,
                'City': data.shippingCity,
                'State': data.shippingState,
                'Zip Code': data.shippingZip,
                'Items': JSON.stringify(data.items),
                'Payment Method': data.paymentMethod || 'pending',
                'Status': 'processing',
                'Timestamp': new Date().toISOString(),
                'Shipment ID': data.shipmentId,
                'Tracking Number': data.trackingNumber,
                'Label URL': data.labelUrl,
                'Shipping Rate': JSON.stringify({
                    carrier: data.selectedRate?.carrier,
                    service: data.selectedRate?.name,
                    cost: data.selectedRate?.price,
                    estimatedDays: data.selectedRate?.estimatedDays
                })
            }
        }]);

        return NextResponse.json({
            success: true,
            recordId: record[0].id,
            shipmentId: data.shipmentId,
            trackingNumber: data.trackingNumber,
            labelUrl: data.labelUrl
        });
    } catch (error) {
        console.error('Error creating shipping order:', error);
        return NextResponse.json(
            { error: 'Failed to create shipping order' },
            { status: 500 }
        );
    }
}