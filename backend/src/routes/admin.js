const express = require('express');
const router = express.Router();
const { getAirtableBase } = require('../config/airtable');
const Order = require('../models/Order');
const DeliveryOrder = require('../models/DeliveryOrder');
const ShippingOrder = require('../models/ShippingOrder');

const base = getAirtableBase();
const ORDERS_TABLE = 'Orders';
const PRODUCTS_TABLE = 'Products';

// Get admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // Fetch orders data
    const [orders, deliveryOrders, shippingOrders] = await Promise.all([
      Order.getAll(),
      DeliveryOrder.getAll(),
      ShippingOrder.getAll()
    ]);

    // Fetch recent orders from Airtable
    const ordersResponse = await base(ORDERS_TABLE)
      .select({
        sort: [{ field: 'Timestamp', direction: 'desc' }],
        maxRecords: 100
      })
      .all();

    const recentOrders = ordersResponse.map(record => ({
      id: record.id,
      orderId: record.get('Order ID'),
      customerName: record.get('Customer Name'),
      status: record.get('Status') || 'pending',
      total: record.get('Total'),
      items: record.get('Items'),
      timestamp: record.get('Timestamp'),
      phone: record.get('Phone'),
      address: record.get('address'),
      type: record.get('Type'),
      paymentMethod: record.get('Payment Method')
    }));

    // Fetch products
    const productsResponse = await base(PRODUCTS_TABLE)
      .select({
        filterByFormula: "{Status} = 'active'"
      })
      .all();

    const products = productsResponse.map(record => ({
      id: record.id,
      name: record.get('Name'),
      category: record.get('Category'),
      price: record.get('Price'),
      description: record.get('Description'),
      stock: record.get('Stock'),
      image: record.get('Image URL'),
      weight: record.get('Weight/Size')
    }));

    // Get unique categories
    const categories = [...new Set(products.map(product => product.category))];

    const stats = {
      totalOrders: orders.length,
      totalDeliveryOrders: deliveryOrders.length,
      totalShippingOrders: shippingOrders.length,
      recentOrders,
      products,
      categories
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get order analytics
router.get('/analytics/orders', async (req, res) => {
  try {
    const [orders, deliveryOrders, shippingOrders] = await Promise.all([
      Order.getAll(),
      DeliveryOrder.getAll(),
      ShippingOrder.getAll()
    ]);

    const analytics = {
      ordersByStatus: {
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      },
      deliveryOrdersByStatus: {
        pending: deliveryOrders.filter(o => o.status === 'pending').length,
        outForDelivery: deliveryOrders.filter(o => o.status === 'out_for_delivery').length,
        delivered: deliveryOrders.filter(o => o.status === 'delivered').length,
        cancelled: deliveryOrders.filter(o => o.status === 'cancelled').length
      },
      shippingOrdersByStatus: {
        pending: shippingOrders.filter(o => o.status === 'pending').length,
        processing: shippingOrders.filter(o => o.status === 'processing').length,
        shipped: shippingOrders.filter(o => o.status === 'shipped').length,
        delivered: shippingOrders.filter(o => o.status === 'delivered').length,
        cancelled: shippingOrders.filter(o => o.status === 'cancelled').length
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting order analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const [orders, deliveryOrders, shippingOrders] = await Promise.all([
      Order.getAll(),
      DeliveryOrder.getAll(),
      ShippingOrder.getAll()
    ]);

    const calculateTotal = (orders) => {
      return orders.reduce((total, order) => {
        const itemsTotal = order.items.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);
        return total + itemsTotal;
      }, 0);
    };

    const analytics = {
      totalRevenue: {
        orders: calculateTotal(orders),
        deliveryOrders: calculateTotal(deliveryOrders),
        shippingOrders: calculateTotal(shippingOrders)
      },
      averageOrderValue: {
        orders: orders.length ? calculateTotal(orders) / orders.length : 0,
        deliveryOrders: deliveryOrders.length ? calculateTotal(deliveryOrders) / deliveryOrders.length : 0,
        shippingOrders: shippingOrders.length ? calculateTotal(shippingOrders) / shippingOrders.length : 0
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
