import { api } from './api';
import type { Product } from '@/types';

export const productService = {
  async getAll(): Promise<Product[]> {
    return api.get<Product[]>('/products');
  },

  async getById(id: string): Promise<Product> {
    return api.get<Product>(`/products/${id}`);
  },

  async getByCategory(category: string): Promise<Product[]> {
    return api.get<Product[]>(`/products?category=${category}`);
  },

  async search(query: string): Promise<Product[]> {
    return api.get<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
  },
}; 