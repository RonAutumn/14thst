import { NextResponse } from 'next/server';
import axios from 'axios';
import { base, TABLES } from '@/lib/airtable';
import { format, parse } from 'date-fns';

export async function POST(request: Request) {
    try {
        const checkoutData = await request.json();
        console.log('Received checkout data:', {
            pickupDate: checkoutData.pickupDate,
            pickupTime: checkoutData.pickupTime
        });

        // Validate required fields
        if (!checkoutData.orderId || !checkoutData.customerEmail || !checkoutData.items) {
            console.error('Missing required fields:', checkoutData);
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate cart is not empty
        if (!checkoutData.items || checkoutData.items.length === 0) {
            console.error('Cart is empty');
            return NextResponse.json(
                { error: 'Cart cannot be empty' },
                { status: 400 }
            );
        }

        // Validate total is greater than 0
        if (!checkoutData.total || checkoutData.total <= 0) {
            console.error('Invalid total amount:', checkoutData.total);
            return NextResponse.json(
                { error: 'Order total must be greater than 0' },
                { status: 400 }
            );
        }

        // Convert amount to cents for payment processing
        const amountInCents = Math.round(checkoutData.total * 100);

        // Create the order in our database
        const orderType = checkoutData.deliveryMethod;
        let tableName;
        let formattedOrder;

        // Format customer details
        const customerName = checkoutData.customerName || '';
        const phoneNumber = checkoutData.customerPhone || '';
        const email = checkoutData.customerEmail;

        // Format the order based on delivery method
        switch (orderType) {
            case 'delivery':
                tableName = TABLES.DELIVERY_ORDERS;
                // Create a proper date object by combining date and time
                const deliveryDateTime = checkoutData.deliveryDate && checkoutData.deliveryTime ?
                    new Date(`${checkoutData.deliveryDate}T${checkoutData.deliveryTime}:00`) : null;

                formattedOrder = {
                    "Order ID": checkoutData.orderId,
                    "Customer Name": customerName,
                    "Email": email,
                    "Phone": phoneNumber,
                    "Address": checkoutData.address?.street || '',
                    "Borough": checkoutData.address?.borough || '',
                    "ZIP Code": checkoutData.address?.zipCode || '',
                    "Delivery Date": deliveryDateTime ? format(deliveryDateTime, 'yyyy-MM-dd HH:mm:ss') : '',
                    "Items": JSON.stringify(checkoutData.items),
                    "Delivery Fee": checkoutData.deliveryFee,
                    "Total": checkoutData.total,
                    "Status": "pending",
                    "Payment Method": "pending",
                    "Timestamp": format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
                };
                break;

            case 'shipping':
                tableName = TABLES.SHIPPING_ORDERS;
                formattedOrder = {
                    "Order ID": checkoutData.orderId,
                    "Customer Name": customerName,
                    "Email": email,
                    "Phone": phoneNumber,
                    "Address": checkoutData.address?.street || '',
                    "City": checkoutData.address?.city || '',
                    "State": checkoutData.address?.state || '',
                    "Zip Code": checkoutData.address?.zipCode || '',
                    "Items": JSON.stringify(checkoutData.items),
                    "Total": checkoutData.total,
                    "Shipping Fee": checkoutData.selectedRate?.price || 0,
                    "Shipping Method": checkoutData.selectedRate?.name || '',
                    "Payment Method": "pending",
                    "Status": "pending",
                    "Timestamp": format(new Date(), 'yyyy-MM-dd HH:mm:ss')
                };
                break;

            case 'pickup':
                tableName = TABLES.PICKUP_ORDERS;
                // Handle pickup date and time properly
                let pickupDateTime = null;
                if (checkoutData.pickupDate && checkoutData.pickupTime) {
                    // Parse the time in 24-hour format
                    const timeStr = checkoutData.pickupTime.padStart(5, '0'); // Ensure HH:mm format
                    pickupDateTime = new Date(`${checkoutData.pickupDate}T${timeStr}:00`);
                    console.log('Formatted pickup date/time:', {
                        original: { date: checkoutData.pickupDate, time: checkoutData.pickupTime },
                        formatted: pickupDateTime
                    });
                }

                formattedOrder = {
                    "Order ID": checkoutData.orderId,
                    "Customer Name": customerName,
                    "Email": email,
                    "Phone": phoneNumber,
                    "Items": JSON.stringify(checkoutData.items),
                    "Total": checkoutData.total,
                    "Status": "pending",
                    "Pickup Date": pickupDateTime ? format(pickupDateTime, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : '',
                    "Payment Method": "stripe",
                    "Timestamp": format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
                };
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid delivery method' },
                    { status: 400 }
                );
        }

        // Create record in Airtable
        try {
            await base(tableName).create([{ fields: formattedOrder }]);
        } catch (error) {
            console.error('Airtable error:', error);
            return NextResponse.json(
                { error: 'Failed to create order in database' },
                { status: 500 }
            );
        }

        // Forward the request to the sister site's checkout endpoint
        try {
            const checkoutResponse = await axios.post(
                'https://stickitrips.vercel.app/api/checkout',
                {
                    orderId: checkoutData.orderId,
                    amount: amountInCents,
                    customerEmail: email,
                    successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success?orderId=${checkoutData.orderId}`,
                    cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/error?message=Payment%20cancelled`,
                    metadata: {
                        orderId: checkoutData.orderId,
                        orderType,
                        source: 'sister_site',
                        orderData: JSON.stringify(checkoutData)
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Origin': process.env.NEXT_PUBLIC_APP_URL,
                        'X-Source-App': 'live1.10'
                    }
                }
            );

            return NextResponse.json({
                success: true,
                redirectUrl: checkoutResponse.data.url,
                sessionId: checkoutResponse.data.sessionId,
                orderId: checkoutResponse.data.orderId
            });

        } catch (error) {
            console.error('Payment redirect error:', error);
            return NextResponse.json(
                { error: 'Failed to initialize payment' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to process checkout' },
            { status: 500 }
        );
    }
} 