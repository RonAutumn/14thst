export interface Address {
    name: string;
    street1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
}

export interface Weight {
    value: number;
    units: 'pounds' | 'ounces' | 'grams';
}

export interface Dimensions {
    length: number;
    width: number;
    height: number;
    units: 'inches' | 'centimeters';
}

export interface ShipmentDetails {
    orderId: string;
    orderNumber: string;
    orderDate: string;
    orderStatus: string;
    customerName: string;
    customerEmail: string;
    billTo: Address;
    shipTo: Address;
    items: Array<{
        sku: string;
        name: string;
        quantity: number;
        unitPrice: number;
        weight?: Weight;
    }>;
    weight?: Weight;
    dimensions?: Dimensions;
    carrierCode?: string;
    serviceCode?: string;
    packageCode?: string;
    confirmation?: string;
    shipDate?: string;
}

export interface ShipmentResponse {
    shipmentId: string;
    orderId: string;
    orderNumber: string;
    status: string;
}

export interface ShippingRate {
    rateId: string;
    serviceName: string;
    serviceCode: string;
    shipmentCost: number;
    otherCost: number;
    totalCost: number;
    transitDays: number;
    carrier: string;
}

export interface ShippingLabel {
    labelId: string;
    trackingNumber: string;
    labelUrl: string;
    shipmentId: string;
}

export interface TrackingInfo {
    trackingNumber: string;
    status: string;
    statusDate: string;
    carrier: string;
} 