import { base } from '@/lib/airtable';
import { NextResponse } from 'next/server';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { fee, freeDeliveryMinimum } = await request.json();

        const record = await base('Fee Management').update([
            {
                id: params.id,
                fields: {
                    'Fee': fee,
                    'Free Delivery Minimum': freeDeliveryMinimum
                }
            }
        ]);

        return NextResponse.json(record[0]);
    } catch (error) {
        console.error('Error updating fee:', error);
        return NextResponse.json({
            error: 'Failed to update fee',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 