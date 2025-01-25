const base = require('../config/airtable');

const TABLE_NAME = 'Orders';

const ShippingOrder = {
  // Get all shipping orders
  getAll: async () => {
    try {
      const records = await base(TABLE_NAME).select({
        filterByFormula: "{Type} = 'shipping'",
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
      console.error('Error getting shipping orders:', error);
      throw error;
    }
  },

  // Create new shipping order
  create: async (orderData) => {
    try {
      const { items, shippingInfo, paymentMethod } = orderData;

      // Format phone number
      const formattedPhone = parseInt(shippingInfo.phone.replace(/\D/g, '')) || null;

      // Generate a unique order ID in the format seen in Airtable (e.g., 539180943)
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000000);
      const orderId = parseInt(`${timestamp % 1000000}${randomNum % 1000}`, 10);

      const record = await base(TABLE_NAME).create([
        {
          fields: {
            'Order ID': orderId,
            'Timestamp': new Date().toISOString(),
            'Customer Name': shippingInfo.customerName,
            'Phone': formattedPhone,
            'address': shippingInfo.address,
            'Items': items,
            'Total': 0, // Total will be calculated in Airtable
            'Payment Method': paymentMethod,
            'Status': 'pending',
            'Type': 'shipping',
            'Email': shippingInfo.email || ''
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
      console.error('Error creating shipping order:', error);
      throw error;
    }
  },

  // Update shipping order status
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
      console.error('Error updating shipping order status:', error);
      throw error;
    }
  }
};

module.exports = ShippingOrder;
