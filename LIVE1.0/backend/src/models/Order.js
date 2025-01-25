const { base, TABLES, formatRecords } = require('@/lib/airtable');
const { generateOrderId, isOrderIdUnique } = require('../utils/orderUtils');
const { sendAdminOrderNotification } = require('../services/notifications');

// Field names in Airtable (matching exact case from Airtable)
const FIELDS = {
  order_id: 'Order ID',
  customer_name: 'Customer Name',
  total: 'Total',
  address: 'address',
  timestamp: 'Timestamp',
  items: 'Items',
  type: 'Type',
  phone: 'Phone',
  payment_method: 'Payment Method',
  status: 'Status'
};

// ============================================================
// ORDER MODEL
// Integration Point: Airtable database operations
// ============================================================

const Order = {
  // =============================
  // Order Retrieval
  // =============================

  // Get all orders
  // Integration Point: Admin dashboard and order management
  getAll: async () => {
    try {
      const records = await formatRecords(TABLES.ORDERS, {
        fields: Object.values(FIELDS),
        sort: [{ field: FIELDS.timestamp, direction: 'desc' }]
      });

      // Format records for frontend consumption
      return records.map(record => ({
        id: record.id,
        orderId: record.fields[FIELDS.order_id],
        timestamp: record.fields[FIELDS.timestamp],
        customerName: record.fields[FIELDS.customer_name],
        phone: record.fields[FIELDS.phone],
        address: record.fields[FIELDS.address],
        items: record.fields[FIELDS.items] || [],
        total: parseFloat(record.fields[FIELDS.total]),
        paymentMethod: record.fields[FIELDS.payment_method],
        status: record.fields[FIELDS.status],
        type: record.fields[FIELDS.type]
      }));
    } catch (error) {
      console.error('Error getting orders:', error);
      throw new Error('Failed to fetch orders');
    }
  },

  // Get order by ID
  // Integration Point: Order details view and tracking
  getById: async (orderId) => {
    try {
      const records = await formatRecords(TABLES.ORDERS, {
        filterByFormula: `{${FIELDS.order_id}} = '${orderId}'`
      });

      if (records.length === 0) {
        return null;
      }

      // Format record for frontend consumption
      const record = records[0];
      return {
        id: record.id,
        orderId: record.fields[FIELDS.order_id],
        timestamp: record.fields[FIELDS.timestamp],
        customerName: record.fields[FIELDS.customer_name],
        phone: record.fields[FIELDS.phone],
        address: record.fields[FIELDS.address],
        items: record.fields[FIELDS.items] || [],
        total: parseFloat(record.fields[FIELDS.total]),
        paymentMethod: record.fields[FIELDS.payment_method],
        status: record.fields[FIELDS.status],
        type: record.fields[FIELDS.type]
      };
    } catch (error) {
      console.error('Error getting order:', error);
      throw new Error('Failed to fetch order');
    }
  },

  // Get orders by type
  // Integration Point: Filtered order views in admin dashboard
  getByType: async (type) => {
    try {
      const records = await formatRecords(TABLES.ORDERS, {
        filterByFormula: `{${FIELDS.type}} = '${type}'`,
        sort: [{ field: FIELDS.timestamp, direction: 'desc' }]
      });

      // Format records for frontend consumption
      return records.map(record => ({
        id: record.id,
        orderId: record.fields[FIELDS.order_id],
        timestamp: record.fields[FIELDS.timestamp],
        customerName: record.fields[FIELDS.customer_name],
        phone: record.fields[FIELDS.phone],
        address: record.fields[FIELDS.address],
        items: record.fields[FIELDS.items] || [],
        total: parseFloat(record.fields[FIELDS.total]),
        paymentMethod: record.fields[FIELDS.payment_method],
        status: record.fields[FIELDS.status],
        type: record.fields[FIELDS.type]
      }));
    } catch (error) {
      console.error(`Error getting ${type} orders:`, error);
      throw new Error(`Failed to fetch ${type} orders`);
    }
  },

  // =============================
  // Order Creation
  // =============================

  // Create new order
  // Integration Point: Cart checkout process
  create: async (orderData) => {
    try {
      // Generate a unique order ID
      let orderId;
      do {
        orderId = generateOrderId();
      } while (!(await isOrderIdUnique(orderId)));

      // Calculate total price
      const total = orderData.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Prepare record data
      const recordData = {
        [FIELDS.order_id]: orderId,
        [FIELDS.customer_name]: orderData.orderInfo.name,
        [FIELDS.total]: total,
        [FIELDS.address]: orderData.orderInfo.address,
        [FIELDS.timestamp]: new Date().toISOString(),
        [FIELDS.items]: JSON.stringify(orderData.items),
        [FIELDS.type]: orderData.type,
        [FIELDS.phone]: orderData.orderInfo.phone,
        [FIELDS.payment_method]: orderData.paymentMethod,
        [FIELDS.status]: 'pending'
      };

      // Create record in Airtable
      const record = await formatRecords(TABLES.ORDERS, recordData);

      // Trigger admin notification asynchronously
      setImmediate(async () => {
        try {
          // Format the order data for notification
          const orderForNotification = {
            orderId,
            items: orderData.items,
            total,
            type: orderData.type,
            paymentMethod: orderData.paymentMethod,
            createdAt: new Date().toISOString(),
            orderInfo: orderData.orderInfo
          };

          await sendAdminOrderNotification(orderForNotification);
        } catch (error) {
          console.error('Error sending admin notification:', error);
          // Don't throw the error since this is a background task
        }
      });

      return {
        id: record.id,
        ...recordData
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // =============================
  // Order Updates
  // =============================

  // Update order status
  // Integration Point: Admin order management
  updateStatus: async (id, status) => {
    try {
      const record = await formatRecords(TABLES.ORDERS, {
        id,
        fields: {
          [FIELDS.status]: status
        }
      });

      if (!record || record.length === 0) {
        throw new Error('Failed to update order status');
      }

      return {
        message: 'Order status updated successfully'
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }
};

module.exports = Order;
