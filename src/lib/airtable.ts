import Airtable, { Record, FieldSet, Records } from 'airtable';
import { OrderRecord, OrderItem, OrderStatus } from '@/types/orders';
import { env } from '@/env.mjs';

// Export the base instance
export const base = new Airtable({ apiKey: env.AIRTABLE_API_KEY }).base(env.AIRTABLE_BASE_ID);

// Consolidated table definitions
export const TABLES = {
  DELIVERY_ORDERS: 'Delivery Orders',
  SHIPPING_ORDERS: 'Shipping Orders',
  PICKUP_ORDERS: 'Pickup Orders',
  PRODUCTS: 'Products',
  CATEGORY: 'Category',
  FEE_MANAGEMENT: 'Fee Management',
  DELIVERY_FEES: 'Delivery_Fees',
  SETTINGS: 'Settings',
  ORDERS: 'Orders'
} as const;

// Helper functions
export const formatRecord = (record: Record<FieldSet>) => ({
  id: record.id,
  ...record.fields
});

export const formatRecords = (records: Records<FieldSet>) => Array.from(records).map(formatRecord);

// Generic create record function
export const createRecord = async (tableName: string, data: any) => {
  try {
    const records = await base(tableName).create([{ fields: data }]);
    return formatRecord(records[0]);
  } catch (error) {
    console.error(`Error creating record in ${tableName}:`, error);
    throw error;
  }
};

// Generic update record function
export const updateRecord = async (tableName: string, recordId: string, data: any) => {
  try {
    const records = await base(tableName).update([{ id: recordId, fields: data }]);
    return formatRecord(records[0]);
  } catch (error) {
    console.error(`Error updating record in ${tableName}:`, error);
    throw error;
  }
};

// Fee record types
interface DeliveryFeeRecord {
  id: string;
  Borough: string;
  Fee: number;
  'Free Delivery Minimum': number;
}

// Get fees by borough
export const getFeeByBorough = async (borough: string): Promise<DeliveryFeeRecord | null> => {
  try {
    const records = await base(TABLES.FEE_MANAGEMENT)
      .select({
        filterByFormula: `{Borough/US} = '${borough}'`
      })
      .firstPage();
    return records.length > 0 ? formatRecord(records[0]) as DeliveryFeeRecord : null;
  } catch (error) {
    console.error('Error getting fee by borough:', error);
    throw error;
  }
};

// Get all fees
export const getFees = async () => {
  try {
    const records = await base(TABLES.FEE_MANAGEMENT).select().all();
    return formatRecords(records);
  } catch (error) {
    console.error('Error getting fees:', error);
    throw error;
  }
};

// Calculate delivery fee
export const calculateDeliveryFee = async (borough: string, subtotal: number) => {
  try {
    const feeRecord = await getFeeByBorough(borough);
    if (!feeRecord) {
      throw new Error(`No delivery fee found for borough: ${borough}`);
    }

    const feeAmount = feeRecord.Fee;
    const freeDeliveryMinimum = feeRecord['Free Delivery Minimum'];

    // If subtotal is above free delivery minimum, no fee
    if (freeDeliveryMinimum > 0 && subtotal >= freeDeliveryMinimum) {
      return 0;
    }

    return feeAmount;
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    throw error;
  }
};

// Create product
export const createProduct = async (data: any) => {
  return createRecord(TABLES.PRODUCTS, data);
};

// Update Airtable record
export const updateAirtableRecord = async (tableName: string, recordId: string, data: any) => {
  return updateRecord(tableName, recordId, data);
};

interface AirtableQueryOptions {
  fields?: string[];
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  filterByFormula?: string;
  maxRecords?: number;
  view?: string;
}

export async function getAirtableData(tableName: string, options: AirtableQueryOptions = {}) {
  try {
    const selectConfig: any = {};

    if (options.fields) selectConfig.fields = options.fields;
    if (options.sort) selectConfig.sort = options.sort;
    if (options.filterByFormula) selectConfig.filterByFormula = options.filterByFormula;
    if (options.maxRecords) selectConfig.maxRecords = options.maxRecords;
    if (options.view) selectConfig.view = options.view;

    const records = await base(tableName).select(selectConfig).all();
    return formatRecords(records);
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    throw error;
  }
}

// Product type definition
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  category?: string[];
  categoryNames?: string[];
  imageUrl?: string;
  weightSize?: string | number;
  isActive: boolean;
  status: string;
  variations?: Array<{
    name: string;
    price: number;
    stock: number;
    isActive: boolean;
  }>;
}

// Get all products from Airtable
export const getProducts = async (): Promise<Product[]> => {
  try {
    const records = await base(TABLES.PRODUCTS).select({
      view: "Grid view",
      filterByFormula: "NOT({Name} = '')",
      sort: [{ field: "Name", direction: "asc" }]
    }).all();

    return Array.from(records).map(record => {
      const weightSizeValue = record.fields['Weight/Size'];
      let weightSize: string | number | undefined = undefined;

      if (typeof weightSizeValue === 'string' || typeof weightSizeValue === 'number') {
        weightSize = weightSizeValue;
      }

      return {
        id: record.id,
        name: String(record.fields.Name || ''),
        description: String(record.fields.Description || ''),
        price: Number(record.fields.Price) || 0,
        stock: Number(record.fields.Stock) || 0,
        category: Array.isArray(record.fields.Category) ? record.fields.Category : [],
        categoryNames: Array.isArray(record.fields['Name (from Category)']) ? record.fields['Name (from Category)'] : [],
        imageUrl: String(record.fields['Image URL'] || ''),
        weightSize,
        isActive: record.fields.Status === 'active',
        status: String(record.fields.Status || 'inactive'),
        variations: record.fields.Variations ? JSON.parse(String(record.fields.Variations)) : []
      };
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Category type definition
export interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive: boolean;
  products?: string[];
}

// Get all categories from Airtable
export const getCategories = async (): Promise<Category[]> => {
  try {
    const records = await base(TABLES.CATEGORY)
      .select({
        view: 'Grid view',
        filterByFormula: "NOT({Name} = '')",
        sort: [{ field: 'Display Order', direction: 'asc' }]
      })
      .all();

    return records.map(record => ({
      id: record.id,
      name: String(record.fields.Name || ''),
      description: String(record.fields.Description || ''),
      displayOrder: Number(record.fields['Display Order']) || 0,
      isActive: Boolean(record.fields['Is Active']),
      products: Array.isArray(record.fields.Products) ? record.fields.Products : []
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Create a new category
export const createCategory = async (data: Omit<Category, 'id'>): Promise<Category> => {
  try {
    const records = await base(TABLES.CATEGORY).create([
      {
        fields: {
          Name: data.name,
          Description: data.description || '',
          'Display Order': data.displayOrder || 0,
          'Is Active': data.isActive,
          Products: data.products || []
        }
      }
    ]);

    const record = records[0];
    return {
      id: record.id,
      name: String(record.fields.Name || ''),
      description: String(record.fields.Description || ''),
      displayOrder: Number(record.fields['Display Order']) || 0,
      isActive: record.fields['Is Active'] === true,
      products: Array.isArray(record.fields.Products) ? record.fields.Products : []
    };
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Update an existing category
export const updateCategory = async (id: string, data: Partial<Omit<Category, 'id'>>): Promise<Category> => {
  try {
    const records = await base(TABLES.CATEGORY).update([
      {
        id,
        fields: {
          ...(data.name && { Name: data.name }),
          ...(data.description !== undefined && { Description: data.description }),
          ...(data.displayOrder !== undefined && { 'Display Order': data.displayOrder }),
          ...(data.isActive !== undefined && { 'Is Active': data.isActive }),
          ...(data.products && { Products: data.products })
        }
      }
    ]);

    const record = records[0];
    return {
      id: record.id,
      name: String(record.fields.Name || ''),
      description: String(record.fields.Description || ''),
      displayOrder: Number(record.fields['Display Order']) || 0,
      isActive: record.fields['Is Active'] === true,
      products: Array.isArray(record.fields.Products) ? record.fields.Products : []
    };
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Get delivery orders
export const getDeliveryOrders = async (): Promise<OrderRecord[]> => {
  try {
    const records = await base(TABLES.DELIVERY_ORDERS).select().all();
    return records.map(record => ({
      id: record.id,
      fields: {
        ...record.fields,
        items: JSON.parse(record.fields.Items as string)
      }
    })) as OrderRecord[];
  } catch (error) {
    console.error('Error getting delivery orders:', error);
    throw error;
  }
};

// Get shipping orders
export const getShippingOrders = async (): Promise<OrderRecord[]> => {
  try {
    const records = await base(TABLES.SHIPPING_ORDERS).select().all();
    return records.map(record => ({
      id: record.id,
      fields: {
        ...record.fields,
        items: JSON.parse(record.fields.Items as string)
      }
    })) as OrderRecord[];
  } catch (error) {
    console.error('Error getting shipping orders:', error);
    throw error;
  }
};

// Create delivery order
export const createDeliveryOrder = async (data: { name: string; email: string; phone: string; address: string; borough: string; items: OrderItem[]; orderId: string; paymentMethod?: string; total: number; deliveryFee?: number }) => {
  return createRecord(TABLES.DELIVERY_ORDERS, {
    'Timestamp': new Date().toISOString(),
    'Customer Name': data.name,
    'Email': data.email,
    'Phone': data.phone,
    'Address': data.address,
    'Borough': data.borough,
    'Items': JSON.stringify(data.items),
    'Order ID': data.orderId,
    'Payment Method': data.paymentMethod || 'card',
    'Status': 'pending',
    'Total': data.total,
    'Delivery Fee': data.deliveryFee || 0
  });
};

// Create shipping order
export const createShippingOrder = async (data: { name: string; email: string; phone: string; shippingAddress: string; items: OrderItem[]; orderId: string; paymentMethod?: string; total: number; shippingFee?: number }) => {
  return createRecord(TABLES.SHIPPING_ORDERS, {
    'Timestamp': new Date().toISOString(),
    'Customer Name': data.name,
    'Email': data.email,
    'Phone': data.phone,
    'Shipping Address': data.shippingAddress,
    'Items': JSON.stringify(data.items),
    'Order ID': data.orderId,
    'Payment Method': data.paymentMethod || 'card',
    'Status': 'pending',
    'Total': data.total,
    'Shipping Fee': data.shippingFee || 0
  });
};

// Update delivery order status
export const updateDeliveryOrderStatus = async (recordId: string, status: OrderStatus) => {
  return updateRecord(TABLES.DELIVERY_ORDERS, recordId, { Status: status });
};

// Update shipping order status
export const updateShippingOrderStatus = async (recordId: string, status: OrderStatus) => {
  return updateRecord(TABLES.SHIPPING_ORDERS, recordId, { Status: status });
};

// Update product
export const updateProduct = async (recordId: string, data: Partial<Product>) => {
  const fields: any = {
    ...(data.name && { Name: data.name }),
    ...(data.description !== undefined && { Description: data.description }),
    ...(data.price !== undefined && { Price: data.price }),
    ...(data.stock !== undefined && { Stock: data.stock }),
    ...(data.category && { Category: data.category }),
    ...(data.imageUrl && { 'Image URL': data.imageUrl }),
    ...(data.weightSize !== undefined && { 'Weight/Size': data.weightSize }),
    ...(data.isActive !== undefined && { Status: data.isActive ? 'active' : 'inactive' }),
    ...(data.variations && { Variations: JSON.stringify(data.variations) })
  };
  return updateRecord(TABLES.PRODUCTS, recordId, fields);
};

// Validate delivery order
export const validateDeliveryOrder = async (data: any) => {
  const requiredFields = ['name', 'email', 'phone', 'address', 'borough', 'items', 'total'];
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new Error('Invalid email format');
  }

  // Validate phone format (basic validation)
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  if (!phoneRegex.test(data.phone)) {
    throw new Error('Invalid phone number format');
  }

  // Validate items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // Validate total
  if (typeof data.total !== 'number' || data.total <= 0) {
    throw new Error('Invalid order total');
  }

  return true;
};

// Create pickup order
export const createPickupOrder = async (data: {
  name: string;
  email: string;
  phone: string;
  items: OrderItem[];
  orderId: string;
  paymentMethod?: string;
  total: number;
  pickupDate: string;
  pickupTime: string;
}) => {
  try {
    // Combine pickup date and time
    const pickupDateTime = new Date(`${data.pickupDate}T${data.pickupTime}`);

    const record = await createRecord(TABLES.PICKUP_ORDERS, {
      'Customer Name': data.name,
      'Email': data.email,
      'Phone': data.phone,
      'Items': JSON.stringify(data.items),
      'Order ID': data.orderId,
      'Payment Method': data.paymentMethod || 'stripe',
      'Total': data.total,
      'Status': 'pending',
      'Pickup Date': pickupDateTime.toISOString(),
      'Timestamp': new Date().toISOString()
    }) as Record<FieldSet>;

    return {
      id: record.id,
      orderId: record.fields['Order ID'] || data.orderId
    };
  } catch (error) {
    console.error('Error creating pickup order:', error);
    throw error;
  }
};