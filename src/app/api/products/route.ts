import { NextResponse } from 'next/server'
import { getProducts, updateProduct, createProduct, Product } from '@/lib/airtable'
import { updateRecord } from '@/lib/airtable'
import { TABLES } from '@/lib/airtable'
import { base } from '@/lib/airtable'

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    console.log('PATCH /api/products - Request body:', body);

    if (!body.recordId) {
      console.error('PATCH /api/products - Missing record ID');
      return NextResponse.json(
        { error: 'Record ID is required for updating a product' },
        { status: 400 }
      );
    }

    // Format weight/size value
    let weightSizeValue = body.weightSize;
    if (typeof weightSizeValue === 'string' && !isNaN(Number(weightSizeValue))) {
      weightSizeValue = Number(weightSizeValue);
    }

    // Prepare the data for Airtable update
    const updateData = {
      Name: body.name,
      Description: body.description || '',
      Price: Number(body.price) || 0,
      Stock: Number(body.stock) || 0,
      Category: Array.isArray(body.category) ? body.category : [],
      'Image URL': body.imageUrl || '',
      'Weight/Size': weightSizeValue,
      Status: body.status || 'active',
      Variations: Array.isArray(body.variations)
        ? JSON.stringify(body.variations)
        : JSON.stringify([])
    };

    console.log('PATCH /api/products - Update data:', updateData);

    // Use updateRecord directly with the PRODUCTS table
    const result = await base(TABLES.PRODUCTS).update([
      { id: body.recordId, fields: updateData }
    ]);

    if (!result || !result.length) {
      throw new Error('Failed to update product in Airtable');
    }

    const updatedRecord = result[0];
    console.log('PATCH /api/products - Raw Airtable response:', updatedRecord);

    // Transform the response to match the frontend expectations
    const transformedProduct = {
      id: updatedRecord.id,
      recordId: updatedRecord.id,
      name: updatedRecord.fields.Name || '',
      description: updatedRecord.fields.Description || '',
      price: Number(updatedRecord.fields.Price) || 0,
      stock: Number(updatedRecord.fields.Stock) || 0,
      category: Array.isArray(updatedRecord.fields.Category) ? updatedRecord.fields.Category : [],
      categoryNames: Array.isArray(updatedRecord.fields['Name (from Category)'])
        ? updatedRecord.fields['Name (from Category)']
        : [],
      imageUrl: updatedRecord.fields['Image URL'] || '',
      weightSize: updatedRecord.fields['Weight/Size'] || '',
      isActive: updatedRecord.fields.Status === 'active',
      status: updatedRecord.fields.Status || 'active',
      variations: updatedRecord.fields.Variations
        ? JSON.parse(String(updatedRecord.fields.Variations))
        : []
    };

    console.log('PATCH /api/products - Transformed response:', transformedProduct);
    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('PATCH /api/products - Error updating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('POST /api/products - Request body:', body);

    // Format weight/size value
    let weightSizeValue = body.weightSize;
    if (typeof weightSizeValue === 'string' && !isNaN(Number(weightSizeValue))) {
      weightSizeValue = Number(weightSizeValue);
    }

    // Prepare the data with correct Airtable field names
    const createData = {
      Name: body.name,
      Description: body.description || '',
      Price: Number(body.price) || 0,
      Stock: Number(body.stock) || 0,
      Category: Array.isArray(body.category) ? body.category : [],
      'Image URL': body.imageUrl || '',
      'Weight/Size': weightSizeValue,
      Status: body.isActive ? 'active' : 'inactive',
      Variations: Array.isArray(body.variations)
        ? JSON.stringify(body.variations)
        : JSON.stringify([])
    };

    console.log('POST /api/products - Create data:', createData);

    // Create the record in Airtable
    const result = await base(TABLES.PRODUCTS).create([
      { fields: createData }
    ]);

    if (!result || !result.length) {
      throw new Error('Failed to create product in Airtable');
    }

    const newRecord = result[0];
    console.log('POST /api/products - Raw Airtable response:', newRecord);

    // Transform the response to match the frontend expectations
    const transformedProduct = {
      id: newRecord.id,
      recordId: newRecord.id,
      name: newRecord.fields.Name || '',
      description: newRecord.fields.Description || '',
      price: Number(newRecord.fields.Price) || 0,
      stock: Number(newRecord.fields.Stock) || 0,
      category: Array.isArray(newRecord.fields.Category) ? newRecord.fields.Category : [],
      categoryNames: Array.isArray(newRecord.fields['Name (from Category)'])
        ? newRecord.fields['Name (from Category)']
        : [],
      imageUrl: newRecord.fields['Image URL'] || '',
      weightSize: newRecord.fields['Weight/Size'] || '',
      isActive: newRecord.fields.Status === 'active',
      status: newRecord.fields.Status || 'active',
      variations: newRecord.fields.Variations
        ? JSON.parse(String(newRecord.fields.Variations))
        : []
    };

    console.log('POST /api/products - Transformed response:', transformedProduct);
    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
} 