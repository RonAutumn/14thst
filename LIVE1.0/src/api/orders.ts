import { NextApiRequest, NextApiResponse } from 'next';
import {
  getDeliveryOrders,
  getShippingOrders,
  createDeliveryOrder,
  createShippingOrder,
  updateDeliveryOrderStatus,
  updateShippingOrderStatus,
  validateDeliveryOrder
} from '@/lib/airtable';
import { 
  OrderRecord, 
  OrderStatus, 
  OrderItem, 
  RawOrderData,
  ShippingOrder,
  DeliveryOrder
} from '@/types/orders';

// Helper function to parse items string to OrderItem array
const parseItems = (items: string | OrderItem[]): OrderItem[] => {
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch (error) {
      console.error('Error parsing items:', error);
      return [];
    }
  }
  return items;
};

// Transform raw order data to typed order data
const transformOrderData = (rawData: RawOrderData): Partial<ShippingOrder | DeliveryOrder> => {
  return {
    id: rawData.id || '',
    orderId: rawData.orderId || '',
    customerName: rawData.customerName || '',
    email: rawData.email || '',
    phone: rawData.phone,
    items: rawData.items ? parseItems(rawData.items) : [],
    status: rawData.status || 'pending',
    total: rawData.total || 0,
    timestamp: rawData.timestamp || new Date().toISOString(),
    deliveryAddress: rawData.deliveryAddress,
    shipmentId: rawData.shipmentId,
    trackingNumber: rawData.trackingNumber,
    labelUrl: rawData.labelUrl
  };
};

// API handler for fetching all orders
export async function getAllOrders(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const [deliveryOrders, shippingOrders] = await Promise.all([
      getDeliveryOrders(),
      getShippingOrders()
    ]);

    const transformedOrders = [...deliveryOrders, ...shippingOrders].map(
      (order: OrderRecord) => ({
        ...order.fields,
        id: order.id,
        items: parseItems(order.fields.items as unknown as string)
      })
    );

    res.status(200).json(transformedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

// API handler for creating a new order
export async function createOrder(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const orderData = req.body;

    // Validate order data
    await validateDeliveryOrder(orderData);

    // Create order based on type
    const result = orderData.type === 'shipping'
      ? await createShippingOrder(orderData)
      : await createDeliveryOrder(orderData);

    res.status(201).json(transformOrderData(result));
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create order' });
  }
}

// API handler for updating order status
export async function updateOrderStatus(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { orderId, status, type } = req.body;

    if (!orderId || !status || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!Object.values(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = type === 'shipping'
      ? await updateShippingOrderStatus(orderId, status as OrderStatus)
      : await updateDeliveryOrderStatus(orderId, status as OrderStatus);

    res.status(200).json(transformOrderData(result));
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
}

// API handler for getting order by ID
export async function getOrderById(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id, type } = req.query;

    if (!id || !type) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const orders = type === 'shipping'
      ? await getShippingOrders()
      : await getDeliveryOrders();

    const order = orders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json(transformOrderData(order.fields));
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
}