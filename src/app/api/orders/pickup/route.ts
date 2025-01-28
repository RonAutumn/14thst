"use client"

import { NextResponse } from 'next/server';
import { base, TABLES } from '@/lib/airtable';
import { logOrderError } from '@/lib/error-logging';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const {
            name,
            email,
            phone,
            pickupDate,
            pickupTime,
            items,
            total,
            orderId,
            paymentMethod = 'card'
        } = data;

        // Combine pickup date and time
        const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);

        // Create the pickup order in Airtable
        const record = await base(TABLES.PICKUP_ORDERS).create([
            {
                fields: {
                    'Timestamp': new Date().toISOString(),
                    'Customer Name': name,
                    'Email': email,
                    'Phone': phone,
                    'Pickup Date': pickupDateTime.toISOString(),
                    'Items': JSON.stringify(items),
                    'Order ID': orderId,
                    'Payment Method': paymentMethod,
                    'Status': 'pending',
                    'Total': total
                }
            }
        ]);

        // Log successful order creation
        console.info('Pickup order created successfully:', {
            orderId: orderId,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, recordId: record[0].id });
    } catch (error) {
        // Log the error with context
        const errorContext = {
            endpoint: 'orders/pickup',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                cause: error.cause,
            } : 'Unknown error'
        };

        logOrderError(
            error instanceof Error ? error : new Error('Unknown error occurred'),
            errorContext
        );

        console.error('Error creating pickup order:', error);

        return NextResponse.json(
            { error: 'Failed to create pickup order' },
            { status: 500 }
        );
    }
} 