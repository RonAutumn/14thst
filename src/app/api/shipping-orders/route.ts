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
                'Status',
                'Shipping Method',
                'Total'
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
            console.log('Raw Airtable order:', order);
            console.log('ZIP Code from Airtable:', order['Zip Code']);

            // Parse items if they're stored as a string
            let parsedItems;
            try {
                parsedItems = typeof order['Items'] === 'string' ? JSON.parse(order['Items']) : order['Items'];
            } catch (error) {
                console.error(`Error parsing items for order ${order['Order ID']}:`, error);
                parsedItems = [];
            }

            const transformedOrder = {
                id: order['Order ID'],
                orderId: order['Order ID'],
                customerName: order['Customer Name'] || '',
                email: order['Email'] || '',
                phone: order['Phone'] || '',
                items: parsedItems,
                status: order['Status'] || 'pending',
                total: parseFloat(order['Total'] || '0'),
                timestamp: order['Timestamp'] || '',
                method: 'shipping' as const,
                address: order['Address'] || '',
                city: order['City'] || '',
                state: order['State'] || '',
                zipCode: order['Zip Code'] || '',
                shipmentId: order['Shipment ID'] || '',
                trackingNumber: order['Tracking Number'] || '',
                labelUrl: order['Label URL'] || '',
                shippingMethod: order['Shipping Method'] || '',
                shippingFee: order['Shipping Fee'] ? parseFloat(order['Shipping Fee']) : 0
            };

            console.log('Transformed order:', transformedOrder);
            console.log('ZIP code in transformed order:', transformedOrder.zipCode);
            return transformedOrder;
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
        const { id, shipmentId, trackingNumber, labelUrl, status, 'Zip Code': zipCode } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const updateData: Partial<AirtableShippingOrder> = {};

        if (status) {
            updateData['Status'] = status;
        }
        if (shipmentId) {
            updateData['Shipment ID'] = shipmentId;
        }
        if (trackingNumber) {
            updateData['Tracking Number'] = trackingNumber;
        }
        if (labelUrl) {
            updateData['Label URL'] = labelUrl;
        }
        if (zipCode) {
            updateData['Zip Code'] = zipCode;
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
            orderNumber: data.orderId,
            orderKey: data.orderId,
            customerName: data.name,
            customerEmail: data.email,
            billTo: {
                name: data.name,
                street1: data.shippingAddress,
                city: data.shippingCity,
                state: data.shippingState,
                postalCode: data.shippingZip,
                country: 'US'
            },
            shipTo: {
                name: data.name,
                street1: data.shippingAddress,
                city: data.shippingCity,
                state: data.shippingState,
                postalCode: data.shippingZip,
                country: 'US'
            },
            items: data.items.map((item: any) => ({
                quantity: item.quantity,
                weight: {
                    value: 1,
                    units: 'ounces'
                }
            })),
            carrierCode: 'stamps_com',
            serviceCode: 'usps_priority_mail',
            packageCode: 'package',
            weight: {
                value: 1,
                units: 'ounces'
            }
        };

        // Create shipment in ShipStation
        const shipmentResponse = await createShipment(shipmentDetails);

        // Create shipping label using the selected rate
        if (data.selectedRate) {
            const label = await createShippingLabel(String(shipmentResponse.shipmentId), data.selectedRate.id);

            // Update data with shipping information
            data.shipmentId = shipmentResponse.shipmentId;
            data.trackingNumber = label.trackingNumber;
            data.labelUrl = label.labelData;
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
                'Shipping Method': data.selectedRate?.name || data.shippingMethod || 'Standard Shipping',
                'Total': data.total || 0
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