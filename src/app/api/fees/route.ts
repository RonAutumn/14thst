import { getAirtableData } from '@/lib/airtable';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const fees = await getAirtableData('Fee Management', {
            fields: [
                'Borough/US',
                'Fee',
                'Free Delivery Minimum'
            ],
            sort: [{ field: 'Borough/US', direction: 'asc' }]
        });

        if (!fees) {
            console.error('No fees found');
            return NextResponse.json({
                error: 'No fees found',
                fees: []
            }, { status: 200 });
        }

        return NextResponse.json({ fees });
    } catch (error) {
        console.error('Error fetching fees:', error);
        return NextResponse.json({
            error: 'Failed to fetch fees',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 