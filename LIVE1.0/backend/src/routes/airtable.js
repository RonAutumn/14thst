const express = require('express');
const router = express.Router();
const { base, TABLES, formatRecords } = require('@/lib/airtable');

// Get all records from a specific table
router.get('/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const records = await base(table).select().all();
        const formattedRecords = records.map(record => ({
            id: record.id,
            ...record.fields
        }));
        res.json({ success: true, data: formattedRecords });
    } catch (error) {
        console.error('Airtable fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch data from Airtable' });
    }
});

// Create a new record in a specific table
router.post('/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const record = await base(table).create([{ fields: req.body }]);
        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Airtable create error:', error);
        res.status(500).json({ success: false, error: 'Failed to create record in Airtable' });
    }
});

// Update a record in a specific table
router.patch('/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const record = await base(table).update([{
            id,
            fields: req.body
        }]);
        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Airtable update error:', error);
        res.status(500).json({ success: false, error: 'Failed to update record in Airtable' });
    }
});

// Delete a record from a specific table
router.delete('/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const record = await base(table).destroy([id]);
        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Airtable delete error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete record from Airtable' });
    }
});

module.exports = router;
