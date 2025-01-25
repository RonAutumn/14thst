const { base, TABLES } = require('@/lib/airtable');

const TABLE_NAME = 'Orders';

const DeliveryOrder = {
  // Get all delivery orders
  getAll: async () => {
    try {
      console.log('DeliveryOrder.getAll - Starting...');

      const records = await base(TABLE_NAME).select({
        filterByFormula: "{Type} = 'delivery'",
        fields: [
          'Order ID',
          'Timestamp',
          'Customer Name',
          'Phone',
          'address',
          'Items',
          'Total',
          'Payment Method',
          'Status',
          'Type',
          'Email'
        ]
      }).all();

      return records.map(record => ({
        id: record.id,
        orderId: record.fields['Order ID'],
        timestamp: record.fields['Timestamp'],
        customerName: record.fields['Customer Name'],
        phone: record.fields['Phone'],
        address: record.fields['address'],
        items: record.fields['Items'] || [],
        total: parseFloat(record.fields['Total']),
        paymentMethod: record.fields['Payment Method'],
        status: record.fields['Status'],
        type: record.fields['Type'],
        email: record.fields['Email']
      }));
    } catch (error) {
      console.error('Error getting delivery orders:', error);
      throw error;
    }
  },

  // Create new delivery order
  create: async (orderData) => {
    try {
      const { items, deliveryInfo, paymentMethod } = orderData;

      // Format phone number
      const formattedPhone = parseInt(deliveryInfo.phone.replace(/\D/g, '')) || null;

      // Generate a unique order ID in the format seen in Airtable (e.g., 539180943)
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000000);
      const orderId = parseInt(`${timestamp % 1000000}${randomNum % 1000}`, 10);

      const record = await base(TABLE_NAME).create([
        {
          fields: {
            'Order ID': orderId,
            'Timestamp': new Date().toISOString(),
            'Customer Name': deliveryInfo.customerName,
            'Phone': formattedPhone,
            'address': deliveryInfo.address,
            'Items': items,
            'Total': 0, // Total will be calculated in Airtable
            'Payment Method': paymentMethod,
            'Status': 'pending',
            'Type': 'delivery',
            'Email': deliveryInfo.email || ''
          }
        }
      ]);

      return {
        id: record[0].id,
        orderId: record[0].fields['Order ID'],
        timestamp: record[0].fields['Timestamp'],
        customerName: record[0].fields['Customer Name'],
        phone: record[0].fields['Phone'],
        address: record[0].fields['address'],
        items: record[0].fields['Items'],
        total: parseFloat(record[0].fields['Total']),
        paymentMethod: record[0].fields['Payment Method'],
        status: record[0].fields['Status'],
        type: record[0].fields['Type'],
        email: record[0].fields['Email']
      };
    } catch (error) {
      console.error('Error creating delivery order:', error);
      throw error;
    }
  },

  // Update delivery order status
  updateStatus: async (id, status) => {
    try {
      const record = await base(TABLE_NAME).update(id, {
        'Status': status
      });

      return {
        id: record.id,
        status: record.fields['Status']
      };
    } catch (error) {
      console.error('Error updating delivery order status:', error);
      throw error;
    }
  }
};

module.exports = DeliveryOrder;
