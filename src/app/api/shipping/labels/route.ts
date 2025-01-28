import { NextResponse } from 'next/server';
import { createShipment } from '@/lib/shipstation';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        console.log('Received request data:', JSON.stringify(data, null, 2));

        // Detailed validation with specific error messages
        const missingFields = [];
        if (!data.orderNumber) missingFields.push('orderNumber');
        if (!data.customerName) missingFields.push('customerName');
        if (!data.customerEmail) missingFields.push('customerEmail');
        if (!data.shipTo) missingFields.push('shipTo');
        if (!data.items || !data.items.length) missingFields.push('items');

        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return NextResponse.json(
                {
                    error: 'Missing required shipping information',
                    missingFields: missingFields
                },
                { status: 400 }
            );
        }

        // Validate shipTo address fields
        if (data.shipTo) {
            const missingAddressFields = [];
            if (!data.shipTo.name) missingAddressFields.push('shipTo.name');
            if (!data.shipTo.street1) missingAddressFields.push('shipTo.street1');
            if (!data.shipTo.city) missingAddressFields.push('shipTo.city');
            if (!data.shipTo.state) missingAddressFields.push('shipTo.state');
            if (!data.shipTo.postalCode) missingAddressFields.push('shipTo.postalCode');

            if (missingAddressFields.length > 0) {
                console.error('Missing required address fields:', missingAddressFields);
                return NextResponse.json(
                    {
                        error: 'Incomplete shipping address',
                        missingFields: missingAddressFields
                    },
                    { status: 400 }
                );
            }
        }

        // Map USPS carrier code to stamps_com
        const carrierCode = data.carrierCode === 'usps' ? 'stamps_com' : data.carrierCode;

        // Map service codes to ShipStation format
        const serviceCodeMap: { [key: string]: string } = {
            'usps_priority_mail_express': 'usps_priority_mail_express',
            'USPS Priority Mail Express - Package': 'usps_priority_mail_express',
            'usps_priority_mail': 'usps_priority_mail',
            'USPS Priority Mail - Package': 'usps_priority_mail'
        };
        const serviceCode = serviceCodeMap[data.serviceCode] || 'usps_priority_mail';

        // First create the order in ShipStation
        const orderData = {
            orderNumber: data.orderNumber,
            orderKey: data.orderNumber,
            orderDate: new Date().toISOString(),
            orderStatus: 'awaiting_shipment',
            customerUsername: data.customerName,
            customerEmail: data.customerEmail,
            billTo: {
                name: data.shipTo.name,
                company: data.shipTo.company || '',
                street1: data.shipTo.street1,
                street2: data.shipTo.street2 || '',
                city: data.shipTo.city,
                state: data.shipTo.state,
                postalCode: data.shipTo.postalCode,
                country: data.shipTo.country || 'US',
                phone: data.shipTo.phone || '',
                residential: true
            },
            shipTo: {
                name: data.shipTo.name,
                company: data.shipTo.company || '',
                street1: data.shipTo.street1,
                street2: data.shipTo.street2 || '',
                city: data.shipTo.city,
                state: data.shipTo.state,
                postalCode: data.shipTo.postalCode,
                country: data.shipTo.country || 'US',
                phone: data.shipTo.phone || '',
                residential: true
            },
            items: data.items.map((item: any, index: number) => ({
                lineItemKey: `ITEM-${index + 1}`,
                sku: `SKU-${index + 1}`,
                name: item.name || 'Product',
                imageUrl: '',
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                warehouseLocation: '',
                productId: index + 1,
                weight: {
                    value: item.weight?.value || 1,
                    units: item.weight?.units || 'ounces'
                }
            })),
            amountPaid: data.items.reduce((total: number, item: any) =>
                total + ((item.unitPrice || 0) * (item.quantity || 1)), 0),
            taxAmount: 0,
            shippingAmount: 0,
            carrierCode: carrierCode,
            serviceCode: serviceCode,
            packageCode: 'package',
            confirmation: 'none',
            weight: {
                value: Math.max(1, data.items.reduce((sum: number, item: any) =>
                    sum + ((item.weight?.value || 1) * (item.quantity || 1)), 0)),
                units: 'ounces'
            },
            dimensions: {
                length: 12,
                width: 12,
                height: 12,
                units: 'inches'
            },
            insuranceOptions: {
                provider: 'carrier',
                insureShipment: false,
                insuredValue: 0
            },
            internationalOptions: {
                contents: 'merchandise',
                customsItems: []
            },
            advancedOptions: {
                warehouseId: null,
                nonMachinable: false,
                saturdayDelivery: false,
                containsAlcohol: false,
                storeId: null,
                customField1: '',
                customField2: '',
                customField3: '',
                source: 'api',
                billToParty: null,
                billToAccount: null,
                billToPostalCode: null,
                billToCountryCode: null
            },
            testLabel: process.env.NODE_ENV !== 'production'
        };

        console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

        // Create the order in ShipStation first
        const orderResponse = await fetch(`${process.env.SHIPSTATION_API_URL}/orders/createorder`, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`).toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('ShipStation order creation error:', {
                status: orderResponse.status,
                statusText: orderResponse.statusText,
                body: errorText
            });
            throw new Error(`ShipStation order creation failed: ${orderResponse.statusText}. ${errorText}`);
        }

        const order = await orderResponse.json();
        console.log('Order created successfully:', JSON.stringify(order, null, 2));

        // Now create the shipping label
        const labelRequest = {
            orderId: parseInt(order.orderId),
            carrierCode: carrierCode,
            serviceCode: serviceCode,
            packageCode: 'package',
            confirmation: 'none',
            shipDate: new Date().toISOString(),
            weight: {
                value: Math.max(1, data.items.reduce((sum: number, item: any) =>
                    sum + ((item.weight?.value || 1) * (item.quantity || 1)), 0)),
                units: 'ounces'
            },
            dimensions: {
                length: 12,
                width: 12,
                height: 12,
                units: 'inches'
            },
            shipFrom: {
                name: process.env.SHIP_FROM_NAME,
                company: process.env.SHIP_FROM_COMPANY,
                street1: process.env.SHIP_FROM_STREET,
                city: process.env.SHIP_FROM_CITY,
                state: process.env.SHIP_FROM_STATE,
                postalCode: process.env.SHIP_FROM_POSTAL_CODE,
                country: process.env.SHIP_FROM_COUNTRY || 'US',
                phone: process.env.SHIP_FROM_PHONE
            },
            shipTo: {
                name: data.shipTo.name,
                company: data.shipTo.company || '',
                street1: data.shipTo.street1,
                street2: data.shipTo.street2 || '',
                city: data.shipTo.city,
                state: data.shipTo.state,
                postalCode: data.shipTo.postalCode,
                country: data.shipTo.country || 'US',
                phone: data.shipTo.phone || '',
                residential: true
            },
            insuranceOptions: {
                provider: 'carrier',
                insureShipment: false,
                insuredValue: 0
            },
            internationalOptions: {
                contents: 'merchandise',
                customsItems: []
            },
            advancedOptions: {
                warehouseId: null,
                nonMachinable: false,
                saturdayDelivery: false,
                containsAlcohol: false,
                storeId: null,
                customField1: '',
                customField2: '',
                customField3: '',
                source: 'api',
                billToParty: null,
                billToAccount: null,
                billToPostalCode: null,
                billToCountryCode: null
            },
            testLabel: process.env.NODE_ENV !== 'production'
        };

        console.log('Creating label with request:', JSON.stringify(labelRequest, null, 2));

        const labelResponse = await fetch(`${process.env.SHIPSTATION_API_URL}/orders/createlabelfororder`, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`).toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(labelRequest)
        });

        if (!labelResponse.ok) {
            const errorText = await labelResponse.text();
            console.error('ShipStation label creation error:', {
                status: labelResponse.status,
                statusText: labelResponse.statusText,
                body: errorText
            });
            throw new Error(`ShipStation label creation failed: ${labelResponse.statusText}. ${errorText}`);
        }

        const label = await labelResponse.json();
        console.log('Label created successfully:', JSON.stringify(label, null, 2));

        return NextResponse.json({
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            labelData: label.labelData,
            trackingNumber: label.trackingNumber
        });
    } catch (error) {
        console.error('Error in shipping label creation:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
} 