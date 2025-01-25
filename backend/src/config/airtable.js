const Airtable = require('airtable');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const getAirtableBase = () => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    throw new Error('Airtable API key and Base ID are required in .env file');
  }

  if (apiKey === 'your_api_key_here' || baseId === 'your_base_id_here') {
    throw new Error('Please replace the placeholder Airtable credentials in .env with actual values');
  }

  console.log('Initializing Airtable with Base ID:', baseId);

  try {
    Airtable.configure({
      endpointUrl: 'https://api.airtable.com',
      apiKey: apiKey
    });

    const base = Airtable.base(baseId);
    
    // Test the connection
    return new Promise((resolve, reject) => {
      base('Products').select({
        maxRecords: 1,
        view: "Grid view"
      }).firstPage((err, records) => {
        if (err) {
          console.error('Error testing Airtable connection:', err);
          reject(new Error('Failed to connect to Airtable. Please check your credentials.'));
          return;
        }
        console.log('Successfully connected to Airtable');
        resolve(base);
      });
    });
  } catch (error) {
    console.error('Error configuring Airtable:', error);
    throw error;
  }
};

module.exports = { getAirtableBase };
