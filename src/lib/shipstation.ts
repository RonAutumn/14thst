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

    // Validate required fields
    if (!details.weight?.value || !details.weight?.units) {
        throw new Error('Weight value and units are required');
    }

    if (!details.packageCode) {
        throw new Error('packageCode is required');
    }

    if (!details.shipTo?.name || !details.shipTo?.street1 || !details.shipTo?.city ||
        !details.shipTo?.state || !details.shipTo?.postalCode) {
        throw new Error('Complete shipping address is required');
    }

    // Ensure country codes are uppercase
    const shipTo = {
        ...details.shipTo,
        country: details.shipTo.country?.toUpperCase() || 'US'
    };

    const shipFrom = {
        name: process.env.SHIP_FROM_NAME,
        company: process.env.SHIP_FROM_COMPANY,
        street1: process.env.SHIP_FROM_STREET,
        city: process.env.SHIP_FROM_CITY,
        state: process.env.SHIP_FROM_STATE,
        postalCode: process.env.SHIP_FROM_POSTAL_CODE,
        country: (process.env.SHIP_FROM_COUNTRY || "US").toUpperCase(),
        phone: process.env.SHIP_FROM_PHONE
    };

    // Validate shipFrom address
    if (!shipFrom.name || !shipFrom.street1 || !shipFrom.city ||
        !shipFrom.state || !shipFrom.postalCode) {
        throw new Error('Incomplete shipFrom address in environment variables');
    }

    const orderData = {
        orderNumber: details.orderNumber,
        orderKey: details.orderKey,
        orderDate: details.orderDate || new Date().toISOString(),
        orderStatus: details.orderStatus || 'awaiting_shipment',
        customerUsername: details.customerName,
        customerEmail: details.customerEmail,
        billTo: {
            ...details.billTo,
            country: details.billTo?.country?.toUpperCase() || 'US'
        },
        shipTo,
        shipFrom,
        items: details.items,
        amountPaid: details.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0),
        taxAmount: 0,
        shippingAmount: 0,
        carrierCode: details.carrierCode || 'stamps_com',
        serviceCode: details.serviceCode || 'usps_first_class_mail',
        packageCode: details.packageCode,
        confirmation: details.confirmation || 'none',
        weight: details.weight,
        dimensions: details.dimensions || {
            length: 12,
            width: 12,
            height: 12,
            units: 'inches'
        },
        testLabel: details.testLabel ?? (process.env.NODE_ENV !== 'production')
    };

    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

    // Create the order in ShipStation
    const orderResponse = await fetch(`${SHIPSTATION_API_URL}/orders/createorder`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
    });

    const order = await handleShipStationResponse<ShipmentResponse>(orderResponse);

    if (!order.orderId || order.orderId === '-1') {
        throw new Error('Failed to create order: Invalid orderId returned');
    }

    console.log('Order created successfully:', JSON.stringify(order, null, 2));

    // Create a label using the shared function
    const label = await createShippingLabel(
        order.orderId,
        orderData.serviceCode,
        {
            carrierCode: orderData.carrierCode,
            packageCode: orderData.packageCode,
            confirmation: orderData.confirmation,
            weight: orderData.weight,
            dimensions: orderData.dimensions,
            testLabel: orderData.testLabel,
            shipTo,
            shipFrom
        }
    );

    // Consider the operation successful if we have label data
    if (!label.labelData) {
        throw new Error('Failed to create shipping label: No label data returned');
    }

    return {
        ...order,
        shipmentId: label.shipmentId || -1,
        labelData: label.labelData,
        trackingNumber: label.trackingNumber
    };
}

export async function getShippingRates(orderId: string): Promise<ShippingRate[]> {
    console.log('Fetching rates for order:', orderId);

    const response = await fetch(`${SHIPSTATION_API_URL}/shipments/getrates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId })
    });

    return handleShipStationResponse<ShippingRate[]>(response);
}

interface CreateLabelOptions {
    carrierCode?: string;
    packageCode?: string;
    confirmation?: string;
    weight?: any;
    dimensions?: any;
    testLabel?: boolean;
    shipTo?: any;
    shipFrom?: any;
}

export async function createShippingLabel(
    orderId: string,
    serviceCode: string,
    options: CreateLabelOptions = {}
): Promise<ShippingLabel> {
    console.log('Creating shipping label for order:', orderId, 'with service:', serviceCode);

    if (!orderId || orderId === '-1') {
        throw new Error('Invalid orderId provided');
    }

    if (!options.packageCode) {
        throw new Error('packageCode is required');
    }

    if (!options.weight) {
        throw new Error('weight is required');
    }

    if (!options.shipTo) {
        throw new Error('shipTo address is required');
    }

    // Ensure country codes are uppercase
    const shipTo = {
        ...options.shipTo,
        country: options.shipTo.country?.toUpperCase() || 'US'
    };

    const shipFrom = options.shipFrom || {
        name: process.env.SHIP_FROM_NAME,
        company: process.env.SHIP_FROM_COMPANY,
        street1: process.env.SHIP_FROM_STREET,
        city: process.env.SHIP_FROM_CITY,
        state: process.env.SHIP_FROM_STATE,
        postalCode: process.env.SHIP_FROM_POSTAL_CODE,
        country: (process.env.SHIP_FROM_COUNTRY || "US").toUpperCase(),
        phone: process.env.SHIP_FROM_PHONE
    };

    // Create label request payload
    const labelRequest = {
        orderId: parseInt(orderId, 10),  // ShipStation expects orderId as a number
        carrierCode: options.carrierCode || (serviceCode.includes('usps') ? 'stamps_com' : 'ups'),
        serviceCode: serviceCode,
        packageCode: options.packageCode || 'package',
        confirmation: options.confirmation || 'none',
        shipDate: new Date().toISOString(),
        weight: {
            value: options.weight?.value || 1,
            units: options.weight?.units || 'ounces'
        },
        dimensions: options.dimensions || {
            length: 12,
            width: 12,
            height: 12,
            units: 'inches'
        },
        shipFrom,
        shipTo,
        insuranceOptions: {
            provider: 'carrier',
            insureShipment: false,
            insuredValue: 0
        },
        internationalOptions: {
            contents: 'merchandise',
            customsItems: []
        },
        advancedOptions: {
            billToParty: null,
            billToAccount: null,
            billToPostalCode: null,
            billToCountryCode: null
        },
        testLabel: options.testLabel ?? (process.env.NODE_ENV !== 'production')
    };

    console.log('Creating label with request:', JSON.stringify(labelRequest, null, 2));

    const response = await fetch(`${SHIPSTATION_API_URL}/shipments/createlabel`, {
        method: 'POST',
        headers,
        body: JSON.stringify(labelRequest)
    });

    const labelResponse = await handleShipStationResponse<ShippingLabel>(response);

    if (!labelResponse.labelData) {
        console.error('Label creation failed:', JSON.stringify(labelResponse, null, 2));
        throw new Error('Failed to create shipping label: No label data returned');
    }

    // If we got label data, consider it a success even if shipmentId is -1
    return {
        ...labelResponse,
        shipmentId: labelResponse.shipmentId || -1
    };
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