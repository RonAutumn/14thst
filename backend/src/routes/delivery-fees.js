const express = require('express');
const router = express.Router();
const { TABLES, getAllRecords, getRecord, createRecord, updateRecord, deleteRecord } = require('../services/airtable');

// Get all delivery fees
router.get('/', async (req, res) => {
  try {
    const fees = await getAllRecords(TABLES.DELIVERY_FEES);
    res.json(fees);
  } catch (error) {
    console.error('Error fetching delivery fees:', error);
    res.status(500).json({ error: 'Failed to fetch delivery fees' });
  }
});

// Get delivery fee by zip code
router.get('/:zipCode', async (req, res) => {
  try {
    const fees = await getAllRecords(TABLES.DELIVERY_FEES);
    const fee = fees.find(f => f.ZipCode === req.params.zipCode);
    
    if (!fee) {
      return res.status(404).json({ error: 'Delivery fee not found for this zip code' });
    }
    
    res.json(fee);
  } catch (error) {
    console.error('Error fetching delivery fee:', error);
    res.status(500).json({ error: 'Failed to fetch delivery fee' });
  }
});

// Create delivery fee
router.post('/', async (req, res) => {
  try {
    const fee = await createRecord(TABLES.DELIVERY_FEES, req.body);
    res.status(201).json(fee);
  } catch (error) {
    console.error('Error creating delivery fee:', error);
    res.status(500).json({ error: 'Failed to create delivery fee' });
  }
});

// Update delivery fee
router.put('/:id', async (req, res) => {
  try {
    const fee = await updateRecord(TABLES.DELIVERY_FEES, req.params.id, req.body);
    res.json(fee);
  } catch (error) {
    console.error('Error updating delivery fee:', error);
    res.status(500).json({ error: 'Failed to update delivery fee' });
  }
});

// Delete delivery fee
router.delete('/:id', async (req, res) => {
  try {
    await deleteRecord(TABLES.DELIVERY_FEES, req.params.id);
    res.json({ message: 'Delivery fee deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery fee:', error);
    res.status(500).json({ error: 'Failed to delete delivery fee' });
  }
});

module.exports = router;
