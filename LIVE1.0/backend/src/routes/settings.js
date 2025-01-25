const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Get delivery fees
router.get('/', async (req, res) => {
  try {
    const fees = await Settings.getDeliveryFees();
    console.log('Delivery fees:', fees); // Add logging
    res.json(fees);
  } catch (error) {
    console.error('Error getting delivery fees:', error);
    res.status(500).json({ error: 'Failed to get delivery fees' });
  }
});

module.exports = router;
