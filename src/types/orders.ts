import { ShippingFormData } from "@/features/cart/types";

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'failed' | 'on-hold';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  weight: number;
}

// Base interface for common order properties
interface BaseOrder {
  id: string;
  orderId: string;
  customerName: string;
  email: string;
  phone?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  timestamp: string;
}

// Interface for raw order data from API
export interface RawOrderData {
  'Order ID'?: string;
  'Customer Name'?: string;
  'Email'?: string;
  'Phone'?: string;
  'Address'?: string;
  'City'?: string;
  'State'?: string;
  'Zip Code'?: string;
  'Items'?: string;
  'Payment Method'?: string;
  'Status'?: OrderStatus;
  'Total'?: number;
  'Timestamp'?: string;
  'Shipment ID'?: string;
  'Tracking Number'?: string;
  'Label URL'?: string;
  'Shipping Method'?: string;
  'Shipping Fee'?: number;
  id?: string;
  orderId?: string;
  address2?: string;
  apartment?: string;
}

export interface ShippingOrder extends BaseOrder {
  address: string;
  address2?: string;  // Optional second address line
  apartment?: string; // Optional apartment/unit number
  city: string;
  state: string;
  zipCode: string;
  shipmentId?: string;
  trackingNumber?: string;
  labelUrl?: string;
  shippingMethod: string;
  shippingFee?: number;
}

export interface DeliveryOrder extends BaseOrder {
  deliveryAddress: string;
  borough: string;
  city: string;
  state: string;
  zipCode: string;
  paymentMethod: string;
  type: 'delivery';
  deliveryDate?: string;
  deliveryInstructions?: string;
}

export interface PickupOrder extends BaseOrder {
  type: 'pickup';
  pickupDate: string;
  pickupTime: string;
}

// Export type for use in components that handle both types
export type Order = ShippingOrder | DeliveryOrder | PickupOrder;

// Airtable record structure for orders
export interface OrderRecord {
  id: string;
  fields: {
    orderId: string;
    customerName: string;
    email: string;
    phone?: string;
    items: OrderItem[];
    status: OrderStatus;
    total: number;
    timestamp: string;
    deliveryAddress?: string;
    shipmentId?: string;
    trackingNumber?: string;
    labelUrl?: string;
  };
}

export interface PickupFormData {
  orderId: string;
  customerName: string;
  email: string;
  phone?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  type: 'pickup';
  pickupDate: string;
  pickupTime: string;
}
