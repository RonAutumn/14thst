const { getBase } = require('../utils/airtableClient');
const TABLES = require('../constants/tables');

const Settings = {
  getDeliveryFees: async () => {
    try {
      const base = getBase();
      const records = await base(TABLES.SETTINGS).select({
        filterByFormula: "{Type} = 'delivery_fees'"
      }).firstPage();
      
      if (records && records.length > 0) {
        const fees = {
          delivery: parseFloat(records[0].fields.delivery_fee) || 5.00,
          minimum_order: parseFloat(records[0].fields.minimum_order) || 20.00
        };
        return fees;
      }
      
      // Default values if no settings found
      return {
        delivery: 5.00,
        minimum_order: 20.00
      };
    } catch (error) {
      console.error('Error fetching delivery fees:', error);
      throw error;
    }
  },

  getShippingFees: async () => {
    try {
      const base = getBase();
      const records = await base(TABLES.SETTINGS).select({
        filterByFormula: "{Type} = 'shipping_fees'"
      }).firstPage();
      
      if (records && records.length > 0) {
        return {
          standard: parseFloat(records[0].fields.standard_fee) || 5.00,
          express: parseFloat(records[0].fields.express_fee) || 15.00
        };
      }
      
      // Default values if no settings found
      return {
        standard: 5.00,
        express: 15.00
      };
    } catch (error) {
      console.error('Error fetching shipping fees:', error);
      throw error;
    }
  },

  calculateShippingFee: async (method = 'standard') => {
    try {
      const fees = await Settings.getShippingFees();
      return {
        method,
        fee: method === 'express' ? fees.express : fees.standard
      };
    } catch (error) {
      console.error('Error calculating shipping fee:', error);
      throw error;
    }
  }
};

module.exports = Settings;
