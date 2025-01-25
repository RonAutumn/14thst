import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  console.log(`[Order API] Fetching order with ID: ${params.orderId}`);
  
  try {
    const orderId = params.orderId;
    console.log(`[Order API] Looking up order for ID: ${orderId}`);

    // Get order data from URL search params
    const url = new URL(request.url);
    const orderData = url.searchParams.get('data');

    if (!orderData) {
      console.error(`[Order API] No order data provided for ID: ${orderId}`);
      return NextResponse.json(
        { error: 'Order data not found' },
        { status: 404 }
      );
    }

    try {
      const order = JSON.parse(decodeURIComponent(orderData));
      console.log(`[Order API] Successfully parsed order data:`, {
        orderId: order.orderId,
        total: order.total,
        items: order.items?.length || 0,
        delivery: order.delivery?.method
      });

      return NextResponse.json(order);
    } catch (parseError) {
      console.error(`[Order API] Failed to parse order data:`, parseError);
      return NextResponse.json(
        { error: 'Invalid order data format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Order API] Error processing order request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
} 