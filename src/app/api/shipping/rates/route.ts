import { NextResponse } from 'next/server';
import { getRatesForPackage } from '@/lib/shipstation';
import { ShippingRate } from '@/types/shipping';

interface RequestData {
    customerName?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    items?: Array<{
        quantity?: number;
        weight?: number;
    }>;
}

interface ShipStationRate {
    serviceCode: string;
    serviceName: string;
    shipmentCost: number;
    transitDays: number;
}

export async function POST(request: Request) {
    try {
        const data: RequestData = await request.json();
        console.log('Received request data:', data);

        // Map items to only include quantity and weight
        const items = (data.items || []).map(item => ({
            quantity: item.quantity || 1,
            weight: {
                value: 1,
                units: 'ounces'
            }
        }));

        // Calculate total weight from items or use default
        const totalWeight = items.reduce(
            (sum, item) => sum + (item.weight.value * item.quantity),
            0
        ) || 1;

        // Get rates for USPS
        const uspsRates = await getRatesForPackage({
            carrierCode: 'stamps_com',
            fromPostalCode: process.env.SHIPSTATION_FROM_ZIP || '10001',
            toPostalCode: data.zipCode || '12345',
            toState: data.state || 'NY',
            toCountry: 'US',
            weight: {
                value: totalWeight,
                units: 'ounces'
            },
            dimensions: {
                length: 12,
                width: 12,
                height: 12,
                units: 'inches'
            }
        });

        console.log('USPS rates:', uspsRates);

        // Get rates for UPS
        const upsRates = await getRatesForPackage({
            carrierCode: 'ups_walleted',
            fromPostalCode: process.env.SHIPSTATION_FROM_ZIP || '10001',
            toPostalCode: data.zipCode || '12345',
            toState: data.state || 'NY',
            toCountry: 'US',
            weight: {
                value: totalWeight,
                units: 'ounces'
            },
            dimensions: {
                length: 12,
                width: 12,
                height: 12,
                units: 'inches'
            }
        });

        console.log('UPS rates:', upsRates);

        const PACKAGING_FEE = 1.25;

        // Default transit days for each service if not provided by API
        const defaultTransitDays = {
            'usps_first_class_mail': 3,
            'usps_priority_mail': 2,
            'usps_priority_mail_express': 1,
            'ups_next_day_air': 1,
            'ups_2nd_day_air': 2,
            'ups_ground': 5
        };

        // Organize rates by carrier
        const rates = {
            usps: (uspsRates as ShipStationRate[])
                .filter(rate => [
                    'usps_first_class_mail',
                    'usps_priority_mail',
                    'usps_priority_mail_express'
                ].includes(rate.serviceCode))
                .map(rate => ({
                    id: rate.serviceCode,
                    name: rate.serviceName,
                    price: rate.shipmentCost + PACKAGING_FEE,
                    estimatedDays: rate.transitDays || defaultTransitDays[rate.serviceCode as keyof typeof defaultTransitDays] || null,
                    carrier: 'usps' as const
                })),
            ups: (upsRates as ShipStationRate[]).map(rate => ({
                id: rate.serviceCode,
                name: rate.serviceName,
                price: rate.shipmentCost + PACKAGING_FEE,
                estimatedDays: rate.transitDays || defaultTransitDays[rate.serviceCode as keyof typeof defaultTransitDays] || null,
                carrier: 'ups' as const
            }))
        };

        console.log('Processed rates:', rates);

        return NextResponse.json({
            success: true,
            rates
        });
    } catch (error) {
        console.error('Error fetching shipping rates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shipping rates', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 