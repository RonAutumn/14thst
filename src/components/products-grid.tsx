'use client';

import { Product } from '@/types/product';
import { ProductCard } from '@/components/product-card';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

async function fetchCategories() {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

export function ProductsGrid({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // Filter active products
  const activeProducts = products.filter(product => product.isActive);

  // If a category is selected, only show products from that category
  const filteredProducts = selectedCategory
    ? activeProducts.filter(product => 
        product.category?.includes(selectedCategory) || 
        product.categoryNames?.includes(selectedCategory)
      )
    : activeProducts;

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No products found in this category.</p>
      </div>
    );
  }

  // Sort categories by display order
  const sortedCategories = [...categories].sort((a, b) => 
    (a.displayOrder || 0) - (b.displayOrder || 0)
  );

  // Create a map of category display orders for sorting products
  const categoryOrderMap = new Map(
    sortedCategories.map(cat => [cat.id, cat.displayOrder || 0])
  );

  // Sort products by their category's display order
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aOrder = Math.min(...(a.category?.map(id => categoryOrderMap.get(id) || Infinity) || [Infinity]));
    const bOrder = Math.min(...(b.category?.map(id => categoryOrderMap.get(id) || Infinity) || [Infinity]));
    return aOrder - bOrder;
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 px-2 sm:px-0">
      {sortedProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
} 