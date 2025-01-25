const { getTable, formatRecord } = require('./airtableClient');
const TABLES = require('../constants/tables');

// Generate a unique order ID with prefix
const generateOrderId = (prefix = 'HH') => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Validate order ID format
const isValidOrderIdFormat = (orderId) => {
  if (typeof orderId !== 'string' || orderId.length < 10) {
    return false;
  }
  // Check if starts with valid prefix and contains only alphanumeric characters
  return /^[A-Z]{2}\d+$/.test(orderId);
};

// Check if order ID exists
const isOrderIdUnique = async (orderId) => {
  try {
    if (!isValidOrderIdFormat(orderId)) {
      throw new Error('Invalid order ID format');
    }

    const table = getTable(TABLES.ORDERS);
    const records = await table.select({
      filterByFormula: `{Order ID} = "${orderId}"`,
      maxRecords: 1
    }).firstPage();

    return records.length === 0;
  } catch (error) {
    console.error('Error checking order ID uniqueness:', error);
    throw error;
  }
};

// Generate a unique order ID with retries
const generateUniqueOrderId = async (prefix = 'HH', maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    const orderId = generateOrderId(prefix);
    if (await isOrderIdUnique(orderId)) {
      return orderId;
    }
  }
  throw new Error('Failed to generate unique order ID after maximum retries');
};

// Format order data for response
const formatOrderResponse = (order) => {
  const formattedOrder = formatRecord(order);
  return {
    ...formattedOrder,
    createdAt: new Date(formattedOrder.createdAt || order._rawJson.createdTime).toISOString(),
    items: Array.isArray(formattedOrder.items) ? formattedOrder.items : [],
    status: formattedOrder.status || 'pending'
  };
};

module.exports = {
  generateOrderId,
  isOrderIdUnique,
  generateUniqueOrderId,
  formatOrderResponse,
  isValidOrderIdFormat
};
