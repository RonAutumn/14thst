import { ShipmentDetails, ShipmentResponse, ShippingRate, ShippingLabel, TrackingInfo } from '@/types/shipstation';

const SHIPSTATION_API_URL = process.env.SHIPSTATION_API_URL;
const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY;
const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET;

if (!SHIPSTATION_API_URL || !SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
    throw new Error('Missing ShipStation API configuration');
}

const headers = {
    'Authorization': 'Basic ' + Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`).toString('base64'),
    'Content-Type': 'application/json'
};

async function handleShipStationResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorText = await response.text();
        console.error('ShipStation API error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
        });
        throw new Error(`ShipStation API error: ${response.statusText}. ${errorText}`);
    }
    return response.json();
}

export async function createShipment(details: ShipmentDetails): Promise<ShipmentResponse> {
    console.log('Creating shipment with details:', JSON.stringify(details, null, 2));

    const response = await fetch(`${SHIPSTATION_API_URL}/orders/createorder`, {
        method: 'POST',
        headers,
        body: JSON.stringify(details)
    });

    return handleShipStationResponse<ShipmentResponse>(response);
}

export async function getShippingRates(shipmentId: string): Promise<ShippingRate[]> {
    console.log('Fetching rates for shipment:', shipmentId);

    const response = await fetch(`${SHIPSTATION_API_URL}/shipments/${shipmentId}/rates`, {
        method: 'GET',
        headers
    });

    return handleShipStationResponse<ShippingRate[]>(response);
}

export async function createShippingLabel(
    shipmentId: string,
    rateId: string
): Promise<ShippingLabel> {
    console.log('Creating shipping label for shipment:', shipmentId, 'with rate:', rateId);

    const response = await fetch(`${SHIPSTATION_API_URL}/shipments/${shipmentId}/createlabel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rateId })
    });

    return handleShipStationResponse<ShippingLabel>(response);
}

export async function getTrackingInfo(trackingNumber: string): Promise<TrackingInfo> {
    console.log('Fetching tracking info for:', trackingNumber);

    const response = await fetch(`${SHIPSTATION_API_URL}/shipments/track`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ trackingNumber })
    });

    return handleShipStationResponse<TrackingInfo>(response);
}

export async function voidShippingLabel(shipmentId: string): Promise<void> {
    console.log('Voiding shipping label for shipment:', shipmentId);

    const response = await fetch(`${SHIPSTATION_API_URL}/shipments/${shipmentId}/voidlabel`, {
        method: 'POST',
        headers
    });

    return handleShipStationResponse<void>(response);
}

export interface GetRatesRequest {
    carrierCode: string;
    fromPostalCode: string;
    toPostalCode: string;
    toState: string;
    toCountry: string;
    weight: {
        value: number;
        units: string;
    };
    dimensions?: {
        length: number;
        width: number;
        height: number;
        units: string;
    };
}

export async function getRatesForPackage(details: {
    carrierCode: string;
    fromPostalCode: string;
    toPostalCode: string;
    toState: string;
    toCountry: string;
    weight: { value: number; units: string; };
    dimensions?: { length: number; width: number; height: number; units: string; };
}): Promise<ShippingRate[]> {
    console.log('Fetching rates with details:', details);
    return fetchFromShipStation('/shipments/getrates', {
        method: 'POST',
        body: JSON.stringify({
            carrierCode: details.carrierCode,
            serviceCode: null,  // Let ShipStation return all available services
            fromPostalCode: details.fromPostalCode,
            toPostalCode: details.toPostalCode,
            toState: details.toState,
            toCountry: details.toCountry,
            weight: details.weight,
            dimensions: details.dimensions,
            packageCode: 'package',
            confirmation: 'none',
            residential: true
        }),
    });
}

async function fetchFromShipStation(endpoint: string, options: RequestInit) {
    const apiKey = process.env.SHIPSTATION_API_KEY;
    const apiSecret = process.env.SHIPSTATION_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('ShipStation API credentials not configured');
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const response = await fetch(`${SHIPSTATION_API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('ShipStation API error:', {
            status: response.status,
            statusText: response.statusText,
            body: error
        });
        throw new Error(`ShipStation API error: ${response.statusText}. ${error}`);
    }

    return response.json();
} 