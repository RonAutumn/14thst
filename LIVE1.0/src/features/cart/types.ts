import { OrderStatus } from '@/types/orders';

export interface BaseOrderData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface DeliveryOrderData extends BaseOrderData {
  address: string;
  city: string;
  state: string;
  zip: string;
  deliveryDate?: string;
  deliveryInstructions?: string;
  items: CartItem[];
}

export interface ShippingOrderData {
  orderId: string;
  timestamp: string;
  customerName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    weight: number;
  }>;
  total: number;
  shippingFee: number;
  status: OrderStatus;
  trackingNumber?: string;
  labelUrl?: string;
  notes?: string;
}

export interface DeliveryFormData extends DeliveryOrderData {
  deliveryDate: string;
  deliveryTime: string;
}

export interface ShippingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingMethod: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    weight: number;
  }>;
  total: number;
  notes?: string;
}

export interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  metadata?: Record<string, string>;
  selectedVariation?: string;
  recordId: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  currency: string;
  paymentIntentId?: string;
  clientSecret?: string;
}

export interface PickupOrderData extends BaseOrderData {
  orderId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  pickupDate: string;
  pickupTime: string;
  status: OrderStatus;
}

export interface PickupFormData extends BaseOrderData {
  pickupDate: string;
  pickupTime: string;
  items: CartItem[];
  total: number;
}
