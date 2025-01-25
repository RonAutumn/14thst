const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize('heavenly_bites', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

const Order = require('./Order');
const Product = require('./Product');
const Category = require('./Category');
const Settings = require('./Settings');

module.exports = {
  Order,
  Product,
  Category,
  Settings
};
