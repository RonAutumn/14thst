import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/airtable'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const products = await getProducts()
    const product = products.find(p => p.id === params.id)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
} 