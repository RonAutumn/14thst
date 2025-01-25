const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.getAll();
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get delivery orders
router.get('/delivery', async (req, res) => {
  try {
    const orders = await Order.getByType('delivery');
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error getting delivery orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get shipping orders
router.get('/shipping', async (req, res) => {
  try {
    const orders = await Order.getByType('shipping');
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error getting shipping orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create delivery order
router.post('/delivery', async (req, res) => {
  try {
    const orderData = {
      items: req.body.items,
      orderInfo: req.body.deliveryInfo,
      paymentMethod: req.body.paymentMethod,
      type: 'delivery'
    };

    const order = await Order.create(orderData);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error creating delivery order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create shipping order
router.post('/shipping', async (req, res) => {
  try {
    const orderData = {
      items: req.body.items,
      orderInfo: req.body.shippingInfo,
      paymentMethod: req.body.paymentMethod,
      type: 'shipping'
    };

    const order = await Order.create(orderData);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error creating shipping order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.updateStatus(id, status);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
