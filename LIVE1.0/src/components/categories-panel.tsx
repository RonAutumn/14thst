'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Category } from '@/lib/airtable';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tag, LayoutGrid } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

async function fetchCategories(): Promise<(Category & { productCount: number })[]> {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

function CategoryList({ 
  categories = [], 
  selectedCategory, 
  onCategoryClick,
  className 
}: { 
  categories?: (Category & { productCount: number })[], 
  selectedCategory: string | null,
  onCategoryClick: (categoryId: string | null) => void,
  className?: string
}) {
  // Filter out inactive categories and sort by display order
  const activeCategories = categories
    .filter(cat => cat.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  if (!categories || !Array.isArray(categories)) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
          !selectedCategory ? 'bg-secondary' : 'hover:bg-secondary/50'
        }`}
        onClick={() => onCategoryClick(null)}
      >
        <LayoutGrid className="h-4 w-4" />
        <span>All Products</span>
        {!selectedCategory && (
          <Badge variant="secondary" className="ml-auto">
            Selected
          </Badge>
        )}
      </div>
      {activeCategories.map((category) => (
        <div
          key={category.id}
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
            selectedCategory === category.id ? 'bg-secondary' : 'hover:bg-secondary/50'
          }`}
          onClick={() => onCategoryClick(category.id)}
        >
          <Tag className="h-4 w-4" />
          <span>{category.name}</span>
          {category.productCount > 0 && (
            <Badge variant="outline" className="ml-auto">
              {category.productCount}
            </Badge>
          )}
          {selectedCategory === category.id && (
            <Badge variant="secondary">
              Selected
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

export function CategoriesPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCategory = searchParams.get('category');

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const handleCategoryClick = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    router.push(`/store?${params.toString()}`);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Failed to load categories</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile Categories Sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg">
              <Tag className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categories
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <CategoryList 
                categories={categories || []} 
                selectedCategory={selectedCategory}
                onCategoryClick={handleCategoryClick}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Categories Panel */}
      <Card className="hidden md:block sticky top-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryList 
            categories={categories || []} 
            selectedCategory={selectedCategory}
            onCategoryClick={handleCategoryClick}
          />
        </CardContent>
      </Card>
    </>
  );
} 