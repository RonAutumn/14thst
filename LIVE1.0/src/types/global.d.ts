import type { OrderStatus, OrderItem, Order, OrderRecord } from './orders';

// Global type declarations
declare global {
  interface Window {
    ENV?: {
      API_URL: string;
      // Add other environment variables as needed
    };
  }
}
