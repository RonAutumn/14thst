export interface Address {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
}

export interface Weight {
    value: number;
    units: string;
}

export interface Dimensions {
    length: number;
    width: number;
    height: number;
    units: string;
}

export interface ShipmentDetails {
    orderNumber: string;
    orderKey: string;
    orderDate?: string;
    orderStatus?: string;
    customerName: string;
    customerEmail: string;
    billTo: Address;
    shipTo: Address;
    items: OrderItem[];
    carrierCode: string;
    serviceCode: string;
    packageCode: string;
    confirmation?: string;
    weight: Weight;
    dimensions?: Dimensions;
    testLabel?: boolean;
}

export interface OrderItem {
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    weight?: Weight;
}

export interface ShipmentResponse {
    orderId: string;
    orderNumber: string;
    orderKey: string;
    shipmentId?: number;
    labelData?: string;
    trackingNumber?: string;
}

export interface ShippingLabel {
    shipmentId: number;
    orderId: string;
    labelData: string;
    trackingNumber: string;
}

export interface ShippingRate {
    serviceCode: string;
    serviceName: string;
    shipmentCost: number;
    otherCost: number;
    totalCost: number;
    transitDays: number;
    carrierCode: string;
}

export interface TrackingInfo {
    trackingNumber: string;
    status: string;
    statusDate: string;
    carrierCode: string;
    trackingUrl?: string;
} 