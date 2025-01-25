'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const orderId = searchParams.get('orderId');

    useEffect(() => {
        if (!orderId) {
            router.push('/');
            return;
        }

        const updateOrderStatus = async () => {
            try {
                // First update the order status to paid
                const updateResponse = await fetch(`/api/order-status/${orderId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: 'paid' }),
                });

                if (!updateResponse.ok) {
                    throw new Error('Failed to update order status');
                }

                // Then get the updated order data
                const getResponse = await fetch(`/api/order-status/${orderId}`);
                const data = await getResponse.json();

                if (!getResponse.ok) {
                    throw new Error(data.error || 'Failed to verify order');
                }

                if (data.success && data.order) {
                    // Redirect to order confirmation with the order data
                    router.push(`/order-confirmation?orderId=${orderId}&orderData=${encodeURIComponent(JSON.stringify(data.order))}`);
                } else {
                    setError('Order verification failed');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error processing order:', error);
                setError('Failed to process order');
                setLoading(false);
            }
        };

        updateOrderStatus();
    }, [orderId, router]);

    if (error) {
        return (
            <Card className="max-w-md mx-auto mt-8">
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/')} className="w-full">
                        Return to Home
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
                <CardTitle>Processing Order</CardTitle>
                <CardDescription>Please wait while we verify your order...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
        </Card>
    );
} 