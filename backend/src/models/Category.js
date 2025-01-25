const { getAirtableBase } = require('../config/airtable');

// Use the exact table name from Airtable
const TABLE_NAME = 'Category'; // Matches exact Airtable table name
const base = getAirtableBase();

const Category = {
  // Get all categories
  getAll: async () => {
    try {
      console.log('Category.getAll - Starting...');
      
      // Validate Airtable configuration
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        throw new Error('Airtable configuration is missing. Please check your .env file.');
      }
      
      console.log('Category.getAll - Fetching records from table:', TABLE_NAME);
      
      const records = await base(TABLE_NAME).select({
        fields: ['Name', 'Description', 'Display Order', 'Is Active'],
        sort: [{ field: 'Display Order', direction: 'asc' }]
      }).all();
      
      console.log('Category.getAll - Records fetched:', records.length);
      
      if (!records || records.length === 0) {
        console.log('Category.getAll - No records found');
        return [];
      }
      
      // Log the first record for debugging
      if (records[0]) {
        console.log('Category.getAll - Sample record fields:', Object.keys(records[0].fields));
      }
      
      const categories = records.map(record => {
        const category = {
          id: record.id,
          name: record.fields.Name || '',
          description: record.fields.Description || '',
          displayOrder: record.fields['Display Order'] || 0,
          isActive: record.fields['Is Active'] !== false
        };
        
        console.log('Category.getAll - Processed category:', category.name);
        return category;
      });
      
      console.log('Category.getAll - Total categories processed:', categories.length);
      return categories;
      
    } catch (error) {
      console.error('Error in getAll categories:', error);
      console.error('Error details:', error.message);
      if (error.error) {
        console.error('Airtable error:', error.error);
      }
      throw error;
    }
  },

  // Get a single category by ID
  getById: async (id) => {
    try {
      console.log('Category.getById - Starting...');
      
      // Validate Airtable configuration
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        throw new Error('Airtable configuration is missing. Please check your .env file.');
      }
      
      console.log('Category.getById - Fetching record from table:', TABLE_NAME);
      
      const record = await base(TABLE_NAME).find(id);
      
      if (!record) {
        console.log('Category.getById - No record found');
        return null;
      }
      
      console.log('Category.getById - Record fetched:', record.id);
      
      const category = {
        id: record.id,
        name: record.fields.Name || '',
        description: record.fields.Description || '',
        displayOrder: record.fields['Display Order'] || 0,
        isActive: record.fields['Is Active'] !== false
      };
      
      console.log('Category.getById - Processed category:', category.name);
      return category;
      
    } catch (error) {
      console.error('Error in getById category:', error);
      console.error('Error details:', error.message);
      if (error.error) {
        console.error('Airtable error:', error.error);
      }
      throw error;
    }
  }
};

module.exports = Category;
