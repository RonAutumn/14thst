// Product Variation Types
export type VariationType = 'flavor' | 'size' | 'brand' | 'strain' | 'weight';

export interface ProductVariation {
  type: string;
  name: string;
  price?: number;
  stock: number;
  isActive: boolean;
}

export interface VariationOption {
  id: string;
  name: string;
  type: VariationType;
  values: string[];
}

export interface ProductDetails {
  productId: string;
  lastUpdated: string;
  thcContent?: number;
  cbdContent?: number;
  strain?: 'sativa' | 'indica' | 'hybrid';
  labTested?: boolean;
  labTestDate?: string;
  labTestProvider?: string;
  coa?: string;
  childResistant?: boolean;
  flavors?: string[];
  ingredients?: string[];
  allergens?: string[];
  effects?: string[];
  terpenes?: string[];
  cartType?: 'distillate' | 'live_resin' | 'rosin' | 'other';
  cartridgeSize?: '0.5g' | '1g' | '2g' | 'other';
  hardwareType?: string;
  coilType?: string;
  batteryCompatibility?: string[];
  warningLabels?: string[];
  complianceNotes?: string;
}

export interface Product {
  id: string;
  recordId?: string;
  name: string;
  description: string;
  price?: number;
  category: string[];
  categoryNames?: string[];
  isActive: boolean;
  imageUrl: string;
  stock: number;
  status: string;
  weightSize: string | number;
  variations?: ProductVariation[];
  strainType?: 'sativa' | 'indica' | 'hybrid';
  brand?: string;
  flavors?: string[];
  details?: any;
}

export interface BundleProduct {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    category: string[];
    isActive: boolean;
    stock: number;
    status: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive: boolean;
  slug: string;
  productCount?: number;
}

export interface CartItem extends Omit<Product, 'variations'> {
  quantity: number;
  selectedVariation?: ProductVariation;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  borough: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'other';
  type: 'delivery' | 'shipping';
  createdAt: string;
  syncedToAirtable: boolean;
  deliveryDate?: string;
  shippingMethod?: string;
  trackingNumber?: string;
}

export interface ProductFormData extends Omit<Product, 'variations' | 'details'> {
  details?: Partial<ProductDetails>;
  variations?: Partial<ProductVariation>[];
  bundleProducts?: BundleProduct[];
  weightSize: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string[];
  imageUrl: string;
  isActive: boolean;
  isSpecialDeal?: boolean;
  originalProductId?: string;
  specialPrice?: number;
  specialStartDate?: string;
  specialEndDate?: string;
  isBundleDeal?: boolean;
  bundleSavings?: number;
}

export interface DeliverySetting {
  borough: string;
  deliveryFee: number;
  freeDeliveryMinimum: number;
}
