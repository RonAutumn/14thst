import type { CartItem } from '@/types/cart';
import type { DeliveryFormData, DeliveryOrderData } from '@/features/cart/types';

export function formatDeliveryData(formData: DeliveryFormData, items: CartItem[], total: number): DeliveryOrderData {
  const orderId = `HH-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  const timestamp = new Date().toISOString();

  return {
    'Order ID': orderId,
    'Timestamp': timestamp,
    'Customer Name': formData.name.trim(),
    'Email': formData.email.trim(),
    'Phone': formData.phone.replace(/\s+/g, ''),
    'Address': formData.address.trim(),
    'Borough': formData.borough,
    'ZIP Code': parseInt(formData.zipCode, 10),
    'Items': JSON.stringify(items.map(item => item.recordId)),
    'Total': total,
    'Delivery Fee': 0, // This will be calculated based on the borough
    'Payment Method': 'pending',
    'Status': 'pending',
    'Delivery Date': formData.deliveryDate,
    'Instructions': formData.instructions?.trim()
  };
} 