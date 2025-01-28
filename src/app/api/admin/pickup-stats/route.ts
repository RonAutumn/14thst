import { NextResponse } from 'next/server';
import { getAirtableData, TABLES } from '@/lib/airtable';
import { startOfHour, subHours, startOfMonth, subMonths } from 'date-fns';

export async function GET() {
    try {
        const now = new Date();
        const lastHour = subHours(startOfHour(now), 1);
        const currentMonth = startOfMonth(now);
        const lastMonth = startOfMonth(subMonths(now, 1));

        // Fetch all pickup orders
        const pickupOrders = await getAirtableData(TABLES.PICKUP_ORDERS, {
            fields: ['Order ID', 'Status', 'Timestamp', 'Pickup Date']
        });

        // Calculate scheduled pickups (pending + processing)
        const scheduledPickups = pickupOrders.filter(order => 
            ['pending', 'processing'].includes(order['Status']?.toLowerCase() || '')
        );

        // Calculate completed pickups
        const completedPickups = pickupOrders.filter(order => 
            order['Status']?.toLowerCase() === 'completed'
        );

        // Calculate changes
        const lastHourScheduled = scheduledPickups.filter(order => 
            new Date(order['Timestamp']) >= lastHour
        ).length;

        const currentMonthCompleted = completedPickups.filter(order => 
            new Date(order['Timestamp']) >= currentMonth
        ).length;

        const lastMonthCompleted = completedPickups.filter(order => 
            new Date(order['Timestamp']) >= lastMonth && 
            new Date(order['Timestamp']) < currentMonth
        ).length;

        // Calculate percentage change
        const completedChange = lastMonthCompleted === 0 
            ? 100 
            : ((currentMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100;

        return NextResponse.json({
            scheduled: {
                total: scheduledPickups.length,
                lastHour: lastHourScheduled
            },
            completed: {
                total: completedPickups.length,
                percentChange: completedChange
            }
        });
    } catch (error) {
        console.error('Error fetching pickup stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pickup statistics' },
            { status: 500 }
        );
    }
} 