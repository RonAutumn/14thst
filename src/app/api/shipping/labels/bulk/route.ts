import { NextResponse } from 'next/server'
import { createShipment, createShippingLabel } from '@/lib/shipstation'
import { base, TABLES, formatRecords } from '@/lib/airtable'
import { ShippingOrder } from '@/types/orders'

export async function POST(req: Request) {
    try {
        const { orderIds } = await req.json()

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json(
                { error: 'No order IDs provided' },
                { status: 400 }
            )
        }

        // Fetch all orders from Airtable
        const records = await base(TABLES.SHIPPING_ORDERS)
            .select({
                filterByFormula: `OR(${orderIds.map(id => `{Order ID} = '${id}'`).join(',')})`
            })
            .all()

        const orders = formatRecords(records)

        if (orders.length === 0) {
            return NextResponse.json(
                { error: 'No orders found' },
                { status: 404 }
            )
        }

        // Process each order
        const results = await Promise.allSettled(
            orders.map(async (order) => {
                const shippingOrder = order as unknown as ShippingOrder

                // Get shipping rates for the order
                const ratesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shipping/rates`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customerName: order['Customer Name'],
                        email: order.Email,
                        address: order.Address,
                        city: order.City,
                        state: order.State,
                        zipCode: order['Zip Code'],
                        items: typeof order.Items === 'string' ? JSON.parse(order.Items) : order.Items,
                        shippingMethod: shippingOrder.shippingMethod
                    })
                })

                if (!ratesResponse.ok) {
                    throw new Error(`Failed to get rates for order ${order['Order ID']}`)
                }

                const ratesData = await ratesResponse.json()

                // Find matching rate
                const matchingRate = [...(ratesData.rates.usps || []), ...(ratesData.rates.ups || [])].find(
                    rate => rate.serviceName?.toLowerCase().includes(shippingOrder.shippingMethod.toLowerCase())
                )

                if (!matchingRate) {
                    throw new Error(`No matching rate found for order ${order['Order ID']}`)
                }

                // Create shipment and label
                const items = (typeof order.Items === 'string' ? JSON.parse(order.Items) : order.Items).map((item) => ({
                    quantity: item.quantity || 1,
                    weight: {
                        value: 1,
                        units: 'ounces'
                    }
                }))

                const shipment = await createShipment({
                    orderNumber: order['Order ID'],
                    customerName: order['Customer Name'],
                    customerEmail: order.Email,
                    rateId: matchingRate.serviceCode || matchingRate.id,
                    serviceCode: matchingRate.serviceName,
                    carrierCode: matchingRate.carrier,
                    packageCode: 'package',
                    shipTo: {
                        name: order['Customer Name'],
                        street1: order.Address,
                        city: order.City,
                        state: order.State,
                        postalCode: order['Zip Code'],
                        country: 'US',
                        phone: order.Phone
                    },
                    items,
                    weight: {
                        value: 1,
                        units: 'ounces'
                    }
                })

                if (!shipment?.shipmentId) {
                    throw new Error(`Failed to create shipment for order ${order['Order ID']}`)
                }

                const label = await createShippingLabel(
                    shipment.orderId.toString(),
                    matchingRate.serviceName,
                    {
                        carrierCode: matchingRate.carrier,
                        packageCode: 'package',
                        weight: {
                            value: 1,
                            units: 'ounces'
                        },
                        shipTo: {
                            name: order['Customer Name'],
                            street1: order.Address,
                            city: order.City,
                            state: order.State,
                            postalCode: order['Zip Code'],
                            country: 'US',
                            phone: order.Phone
                        }
                    }
                )

                if (!label?.labelData) {
                    throw new Error(`Failed to create label for order ${order['Order ID']}`)
                }

                // Update order in Airtable
                await base(TABLES.SHIPPING_ORDERS).update([{
                    id: order.id,
                    fields: {
                        Status: 'processing',
                        'Tracking Number': label.trackingNumber
                    }
                }])

                return {
                    orderId: order['Order ID'],
                    trackingNumber: label.trackingNumber,
                    labelUrl: label.labelData
                }
            })
        )

        // Process results
        const successful = results.filter(r => r.status === 'fulfilled')
        const failed = results.filter(r => r.status === 'rejected')

        return NextResponse.json({
            success: successful.length,
            failed: failed.length,
            results: {
                successful: successful.map(r => (r as PromiseFulfilledResult<any>).value),
                failed: failed.map(r => ({
                    error: (r as PromiseRejectedResult).reason.message
                }))
            }
        })

    } catch (error) {
        console.error('Error creating bulk labels:', error)
        return NextResponse.json(
            { error: 'Failed to create shipping labels' },
            { status: 500 }
        )
    }
} 
