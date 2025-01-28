import { NextResponse } from 'next/server';
import { getAirtableData, TABLES } from '@/lib/airtable';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET() {
    try {
        const now = new Date();
        const currentMonth = startOfMonth(now);
        const lastMonth = startOfMonth(subMonths(now, 1));

        // Fetch orders from available tables
        const [deliveryOrders, shippingOrders] = await Promise.all([
            getAirtableData(TABLES.DELIVERY_ORDERS, {
                fields: ['Order ID', 'Total', 'Status', 'Timestamp'],
            }),
            getAirtableData(TABLES.SHIPPING_ORDERS, {
                fields: ['Order ID', 'Total', 'Status', 'Timestamp'],
            })
        ]);

        // Function to calculate monthly metrics
        const calculateMonthlyMetrics = (orders: any[], startDate: Date, endDate: Date) => {
            return orders.reduce((acc, order) => {
                const orderDate = new Date(order['Timestamp']);
                if (orderDate >= startDate && orderDate <= endDate) {
                    acc.count++;
                    acc.revenue += Number(order['Total']) || 0;
                }
                return acc;
            }, { count: 0, revenue: 0 });
        };

        // Calculate current month metrics
        const currentMonthEnd = endOfMonth(currentMonth);
        const currentDeliveryMetrics = calculateMonthlyMetrics(deliveryOrders, currentMonth, currentMonthEnd);
        const currentShippingMetrics = calculateMonthlyMetrics(shippingOrders, currentMonth, currentMonthEnd);

        // Calculate last month metrics
        const lastMonthEnd = endOfMonth(lastMonth);
        const lastDeliveryMetrics = calculateMonthlyMetrics(deliveryOrders, lastMonth, lastMonthEnd);
        const lastShippingMetrics = calculateMonthlyMetrics(shippingOrders, lastMonth, lastMonthEnd);

        // Calculate monthly revenue data for the chart
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const monthStart = startOfMonth(subMonths(now, 11 - i));
            const monthEnd = endOfMonth(monthStart);
            const monthlyMetrics = calculateMonthlyMetrics(
                [...deliveryOrders, ...shippingOrders],
                monthStart,
                monthEnd
            );
            return {
                name: format(monthStart, 'MMM'),
                total: monthlyMetrics.revenue
            };
        });

        // Calculate current month totals
        const currentTotalRevenue = currentDeliveryMetrics.revenue + currentShippingMetrics.revenue;
        const currentTotalOrders = currentDeliveryMetrics.count + currentShippingMetrics.count;
        const lastTotalRevenue = lastDeliveryMetrics.revenue + lastShippingMetrics.revenue;
        const lastTotalOrders = lastDeliveryMetrics.count + lastShippingMetrics.count;

        // Calculate percentage changes
        const revenueChange = lastTotalRevenue === 0 ? 100 : ((currentTotalRevenue - lastTotalRevenue) / lastTotalRevenue) * 100;
        const ordersChange = lastTotalOrders === 0 ? 100 : ((currentTotalOrders - lastTotalOrders) / lastTotalOrders) * 100;

        // Count pending orders
        const pendingDelivery = deliveryOrders.filter(o => o['Status'] === 'pending').length;
        const pendingShipping = shippingOrders.filter(o => o['Status'] === 'pending').length;

        return NextResponse.json({
            overview: {
                totalRevenue: {
                    current: currentTotalRevenue,
                    percentChange: revenueChange
                },
                totalOrders: {
                    current: currentTotalOrders,
                    percentChange: ordersChange
                },
                deliveryOrders: {
                    pending: pendingDelivery
                },
                shippingOrders: {
                    pending: pendingShipping
                }
            },
            monthlyData
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
} 