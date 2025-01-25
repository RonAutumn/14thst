const sequelize = require('../models/index');
const Product = require('../models/Product');
const { Order, OrderItem } = require('../models/Order');
const Customer = require('../models/Customer');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    // Sync all models with database
    await sequelize.sync({ force: true }); // Warning: This will drop existing tables
    console.log('Database synchronized');

    // Import products from JSON
    const productsPath = path.join(__dirname, '..', 'products.json');
    if (fs.existsSync(productsPath)) {
      const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      
      // Convert products data to match new schema
      const products = productsData.map(product => ({
        name: product.name,
        description: product.description,
        price: product.variations[0].price,
        stock: product.stock,
        image_url: product.image,
        category: product.category
      }));

      // Bulk create products
      await Product.bulkCreate(products);
      console.log('Products imported successfully');
    }

    // Import orders if they exist
    const ordersPath = path.join(__dirname, '..', 'orders.json');
    if (fs.existsSync(ordersPath)) {
      const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
      
      for (const order of ordersData) {
        // Create customer if not exists
        const [customer] = await Customer.findOrCreate({
          where: { email: order.email },
          defaults: { name: order.customer_name || 'Unknown' }
        });

        // Create order
        const newOrder = await Order.create({
          customer_name: customer.name,
          customer_email: customer.email,
          total_amount: order.total,
          order_status: 'completed',
          CustomerId: customer.id
        });

        // Create order items
        for (const item of order.items) {
          const product = await Product.findOne({ where: { name: item.name } });
          if (product) {
            await OrderItem.create({
              OrderId: newOrder.id,
              ProductId: product.id,
              quantity: item.quantity,
              price_at_time: item.selectedVariation?.price || 0
            });
          }
        }
      }
      console.log('Orders imported successfully');
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = { initializeDatabase };
