const express = require('express');
const router = express.Router();
const { TABLES, getAllRecords, getRecord, createRecord, updateRecord, deleteRecord } = require('../services/airtable');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await getAllRecords(TABLES.ORDERS);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await getRecord(TABLES.ORDERS, req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get orders by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await getAllRecords(TABLES.ORDERS);
    const userOrders = orders.filter(order => order.UserId === req.params.userId);
    res.json(userOrders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

// Create order
router.post('/', async (req, res) => {
  try {
    const order = await createRecord(TABLES.ORDERS, {
      ...req.body,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      Status: 'pending'
    });
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const order = await updateRecord(TABLES.ORDERS, req.params.id, {
      ...req.body,
      UpdatedAt: new Date().toISOString()
    });
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const order = await updateRecord(TABLES.ORDERS, req.params.id, {
      Status: status,
      UpdatedAt: new Date().toISOString()
    });
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    await deleteRecord(TABLES.ORDERS, req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;
