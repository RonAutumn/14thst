import { NextResponse } from 'next/server';
import { getCategories, createCategory, updateCategory } from '@/lib/airtable';

// Add dynamic flag to prevent static optimization
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    const categories = await getCategories();

    // Add product count (this will be updated when we implement product-category relationships)
    const categoriesWithCount = categories.map(category => ({
      ...category,
      productCount: 0 // This will be updated when we implement product counting
    }));

    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('POST /api/categories - Request body:', body);

    const newCategory = await createCategory({
      name: body.name,
      description: body.description,
      displayOrder: body.displayOrder,
      isActive: body.isActive
    });

    console.log('POST /api/categories - Category created:', newCategory);
    return NextResponse.json(newCategory);
  } catch (error) {
    console.error('POST /api/categories - Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    console.log('PATCH /api/categories - Request body:', body);

    if (!body.id) {
      console.error('PATCH /api/categories - Missing category ID');
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const updatedCategory = await updateCategory(body.id, {
      name: body.name,
      description: body.description,
      displayOrder: body.displayOrder,
      isActive: body.isActive
    });

    console.log('PATCH /api/categories - Category updated:', updatedCategory);
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('PATCH /api/categories - Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
} 