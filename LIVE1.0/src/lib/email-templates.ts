import { format } from 'date-fns';

export interface OrderData {
    orderId: string;
    total: number;
    items: Array<{
        name: string;
        price: number;
        quantity: number;
    }>;
    address?: string;
    borough?: string;
    deliveryDate?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingZip?: string;
    trackingNumber?: string;
    pickupDate?: string;
    pickupTime?: string;
}

export const generateOrderConfirmationEmail = (
    orderType: 'delivery' | 'shipping' | 'pickup',
    orderData: OrderData
) => {
    const baseTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2e7d32;">Order Confirmation</h1>
      <p>Thank you for your order! Here are your order details:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px;">
        <h2 style="color: #333; margin-bottom: 15px;">Order Summary</h2>
        <p><strong>Order ID:</strong> ${orderData.orderId}</p>
        <p><strong>Order Type:</strong> ${orderType.charAt(0).toUpperCase() + orderType.slice(1)}</p>
        <p><strong>Total:</strong> $${orderData.total.toFixed(2)}</p>
  `;

    const typeSpecificTemplate = {
        delivery: `
        <p><strong>Delivery Address:</strong> ${orderData.address}</p>
        <p><strong>Borough:</strong> ${orderData.borough}</p>
        <p><strong>Estimated Delivery:</strong> ${orderData.deliveryDate}</p>
        <p><em>Delivery orders will arrive within a 1 hour and 30 minutes window from your selected delivery time.</em></p>
    `,
        shipping: `
        <p><strong>Shipping Address:</strong> ${orderData.shippingAddress}</p>
        <p><strong>City:</strong> ${orderData.shippingCity}</p>
        <p><strong>State:</strong> ${orderData.shippingState}</p>
        <p><strong>ZIP Code:</strong> ${orderData.shippingZip}</p>
        <p><strong>Tracking Number:</strong> ${orderData.trackingNumber || 'Will be provided soon'}</p>
        <p><em>Shipping orders are usually shipped the next business day.</em></p>
    `,
        pickup: `
        <p><strong>Pickup Location:</strong> 123 Main St, New York, NY</p>
        <p><strong>Pickup Date:</strong> ${orderData.pickupDate}</p>
        <p><strong>Pickup Time:</strong> ${orderData.pickupTime}</p>
        <p><em>You will receive a text 30 minutes prior to your pickup time. If you have any questions, please call us at <strong>718-206-9021</strong>.</em></p>
    `
    };

    const itemsTemplate = `
        <h3 style="margin-top: 20px;">Items:</h3>
        <ul style="list-style: none; padding: 0;">
          ${orderData.items
            .map(
                (item) => `
            <li style="padding: 10px; border-bottom: 1px solid #eee;">
              ${item.name} - $${item.price.toFixed(2)} x ${item.quantity}
            </li>
          `
            )
            .join('')}
        </ul>
  `;

    const closingTemplate = `
      </div>
      
      <p style="margin-top: 30px;">
        If you have any questions about your order, please reply to this email or contact us at support@heavenhighnyc.com.
      </p>
      
      <p style="color: #666; font-size: 0.9em; margin-top: 40px;">
        Thank you for choosing Heaven High NYC!
      </p>
    </div>
  `;

    return baseTemplate + typeSpecificTemplate[orderType] + itemsTemplate + closingTemplate;
}; 