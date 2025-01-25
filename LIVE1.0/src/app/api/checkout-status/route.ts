import { NextResponse } from 'next/server';
import { base, TABLES } from '@/lib/airtable';
import { Resend } from 'resend';
import { headers } from 'next/headers';
import { generateOrderConfirmationEmail } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@heavenhighnyc.com';
const SISTER_SITE_DOMAIN = 'stickitrips.vercel.app';

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

// Handle GET requests for success redirects
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const orderId = url.searchParams.get('orderId');
        const status = url.searchParams.get('status') || 'success';
        const orderData = url.searchParams.get('orderData');

        if (!orderId) {
            return NextResponse.redirect('/error?message=Missing order ID');
        }

        // Process the order status update
        const result = await updateOrderStatus(orderId, status, undefined, orderData ? JSON.parse(orderData) : undefined);

        if (!result.success) {
            return NextResponse.redirect('/error?message=' + encodeURIComponent(result.error || 'Unknown error'));
        }

        // Get the host from headers for absolute URL
        const headersList = headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const baseUrl = `${protocol}://${host}`;

        // Redirect to order confirmation with absolute URL
        return NextResponse.redirect(`${baseUrl}/order-confirmation?orderId=${encodeURIComponent(orderId)}&orderData=${encodeURIComponent(JSON.stringify(result.orderData))}`);
    } catch (error) {
        console.error('Error processing success callback:', error);
        return NextResponse.redirect('/error?message=Failed to process order');
    }
}

// Handle POST requests for direct API calls
export async function POST(request: Request) {
    try {
        const { orderId, status, message } = await request.json();
        console.log('Updating order status:', { orderId, status, message });

        if (!orderId || !status) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Find the order in all tables
        const tables = [TABLES.DELIVERY_ORDERS, TABLES.SHIPPING_ORDERS, TABLES.PICKUP_ORDERS];
        let orderRecord = null;
        let tableName = '';

        for (const table of tables) {
            try {
                const records = await base(table).select({
                    filterByFormula: `{Order ID} = '${orderId}'`
                }).firstPage();

                if (records.length > 0) {
                    orderRecord = records[0];
                    tableName = table;
                    console.log('Found order in table:', table);
                    break;
                }
            } catch (error) {
                console.error(`Error searching table ${table}:`, error);
            }
        }

        if (!orderRecord) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Update the order status
        try {
            await base(tableName).update([
                {
                    id: orderRecord.id,
                    fields: {
                        "Status": status,
                        "Payment Method": status === 'paid' ? 'stripe' : 'pending'
                    }
                }
            ]);

            return NextResponse.json({
                success: true,
                message: 'Order status updated successfully'
            });
        } catch (error) {
            console.error('Error in updateOrderStatus:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json(
            { error: 'Failed to update order status' },
            { status: 500 }
        );
    }
}

// Helper function to update order status
async function updateOrderStatus(orderId: string, status: string, message?: string, orderData?: any) {
    try {
        console.log('Updating order status:', { orderId, status, message, orderData });

        // Find the order in all tables
        const tables = [TABLES.DELIVERY_ORDERS, TABLES.SHIPPING_ORDERS, TABLES.PICKUP_ORDERS];
        let tableName;
        let records;
        let orderType;

        for (const table of tables) {
            const result = await base(table)
                .select({
                    filterByFormula: `{Order ID} = '${orderId}'`
                })
                .firstPage();

            if (result && result.length > 0) {
                tableName = table;
                records = result;
                orderType = table === TABLES.DELIVERY_ORDERS ? 'delivery' :
                    table === TABLES.SHIPPING_ORDERS ? 'shipping' : 'pickup';
                break;
            }
        }

        if (!records || records.length === 0 || !tableName || !orderType) {
            throw new Error('Order not found');
        }

        const record = records[0];
        console.log('Found order in table:', tableName);

        // Update the order status
        await base(tableName).update([{
            id: record.id,
            fields: {
                'Status': status === 'success' ? 'paid' :
                    status === 'failed' ? 'failed' :
                        'pending',
                'Last Updated': new Date().toISOString(),
                'Status Message': message || '',
                'Sister Site Verified': true
            }
        }]);

        console.log('Updated order status successfully');

        // Send confirmation email to customer if payment is successful
        if (status === 'success' && record.fields.Email) {
            const items = typeof record.fields.Items === 'string'
                ? JSON.parse(record.fields.Items)
                : record.fields.Items;

            const emailData = {
                orderId: record.fields['Order ID'],
                total: parseFloat(record.fields.Total),
                items,
                // Delivery specific fields
                address: record.fields.Address,
                borough: record.fields.Borough,
                deliveryDate: record.fields['Delivery Date'],
                // Shipping specific fields
                shippingAddress: record.fields.Address,
                shippingCity: record.fields.City,
                shippingState: record.fields.State,
                shippingZip: record.fields['Zip Code'],
                trackingNumber: record.fields['Tracking Number'],
                // Pickup specific fields
                pickupDate: record.fields['Pickup Date'],
                pickupTime: record.fields['Pickup Time']
            };

            const { data: customerEmailData, error: customerEmailError } = await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: record.fields.Email,
                subject: `Order Confirmation - #${orderId}`,
                html: generateOrderConfirmationEmail(orderType, emailData)
            });

            if (customerEmailError) {
                console.error('Error sending customer confirmation email:', customerEmailError);
            }

            // Send notification to admin
            const { data, error: adminEmailError } = await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: ADMIN_EMAIL,
                subject: `New Order Received - #${orderId}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #2e7d32;">New Order Received</h1>
                        <p>A new order has been placed and payment has been confirmed.</p>
                        
                        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px;">
                            <h2 style="color: #333; margin-bottom: 15px;">Order Details</h2>
                            <p><strong>Order ID:</strong> ${orderId}</p>
                            <p><strong>Order Type:</strong> ${orderType}</p>
                            <p><strong>Customer:</strong> ${record.fields['Customer Name']}</p>
                            <p><strong>Email:</strong> ${record.fields.Email}</p>
                            <p><strong>Phone:</strong> ${record.fields.Phone}</p>
                            <p><strong>Total:</strong> $${record.fields.Total}</p>
                        </div>

                        <p style="margin-top: 30px;">
                            Please process this order according to the standard operating procedures.
                        </p>
                    </div>
                `
            });

            if (adminEmailError) {
                console.error('Error sending admin notification email:', adminEmailError);
            }
        }

        return {
            success: true,
            orderData: {
                ...record.fields,
                orderType,
                status: status === 'success' ? 'paid' : status === 'failed' ? 'failed' : 'pending'
            }
        };

    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 500
        };
    }
} 