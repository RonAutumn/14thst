export interface ShippingRate {
    id: string;
    name: string;
    price: number;
    estimatedDays: number;
    carrier?: 'usps' | 'ups';
}

export interface ShippingAddress {
    street1: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
}

export interface ShippingSettings {
    zipCode: string;
    weight?: number;
    selectedRateId?: string;
} 