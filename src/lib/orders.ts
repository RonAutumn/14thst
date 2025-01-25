import fs from 'fs';
import path from 'path';

const ORDERS_DIR = path.join(process.cwd(), 'data', 'orders');
const ACCEPTED_DIR = path.join(ORDERS_DIR, 'accepted');
const PROCESSED_DIR = path.join(ORDERS_DIR, 'processed');

// Ensure directories exist
[ORDERS_DIR, ACCEPTED_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

interface BaseDelivery {
  name: string;
  phone: string;
  email: string;
  method: 'delivery' | 'shipping';
  fee: number;
}

interface DeliveryMethod extends BaseDelivery {
  method: 'delivery';
  address: string;
  zipCode: string;
  borough: string;
  instructions?: string;
  deliveryDate: string;
}

interface ShippingMethod extends BaseDelivery {
  method: 'shipping';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderData {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  delivery: DeliveryMethod | ShippingMethod;
  status: string;
  total: number;
  timestamp: string;
}

// Export types for use in other files
export type { BaseDelivery, DeliveryMethod, ShippingMethod, OrderData }; 