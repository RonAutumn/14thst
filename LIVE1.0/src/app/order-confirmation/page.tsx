'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function OrderConfirmationPage() {
    const [status, setStatus] = useState<'success' | 'error' | 'loading'>('loading');
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    
    const orderId = searchParams.get('orderId');
    const orderDataStr = searchParams.get('orderData');

    useEffect(() => {
        if (!orderId || !orderDataStr) {
            setStatus('error');
            toast({
                title: 'Error',
                description: 'Missing order information',
                variant: 'destructive',
            });
            return;
        }

        try {
            const orderData = JSON.parse(orderDataStr);
            setOrderDetails(orderData);
            setStatus('success');
            toast({
                title: 'Order Confirmed',
                description: 'Thank you for your purchase!',
            });
        } catch (error) {
            console.error('Error parsing order data:', error);
            setStatus('error');
            toast({
                title: 'Error',
                description: 'There was a problem processing your order information',
                variant: 'destructive',
            });
        }
    }, [orderId, orderDataStr, toast]);

    const formatDateTime = (date: string, time?: string) => {
        try {
            if (!date) return '';
            
            // If we have both date and time
            if (time) {
                return format(new Date(`${date} ${time}`), 'MMMM d, yyyy h:mm a');
            }
            
            // If the date is an ISO string (includes time)
            if (date.includes('T')) {
                return format(parseISO(date), 'MMMM d, yyyy h:mm a');
            }
            
            // If we just have a date
            return format(new Date(date), 'MMMM d, yyyy');
        } catch (error) {
            console.error('Error formatting date:', error);
            return date;
        }
    };

    const renderOrderDetails = () => {
        if (!orderDetails) return null;

        const items = typeof orderDetails.Items === 'string' 
            ? JSON.parse(orderDetails.Items) 
            : orderDetails.Items;

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Order Details</h3>
                    <p>Order ID: {orderDetails.orderId}</p>
                    <p>Status: {orderDetails.status}</p>
                    <p>Total: ${orderDetails.Total}</p>
                </div>

                {orderDetails.orderType === 'pickup' && (
                    <div>
                        <h3 className="font-semibold mb-2">Pickup Information</h3>
                        <p>Pickup Date & Time: {formatDateTime(orderDetails['Pickup Date'], orderDetails['Pickup Time'])}</p>
                    </div>
                )}

                {orderDetails.orderType === 'delivery' && (
                    <div>
                        <h3 className="font-semibold mb-2">Delivery Information</h3>
                        <p>Address: {orderDetails.Address}</p>
                        <p>Borough: {orderDetails.Borough}</p>
                        <p>Delivery Date & Time: {formatDateTime(orderDetails['Delivery Date'], orderDetails['Delivery Time'])}</p>
                        {orderDetails.Instructions && (
                            <p>Instructions: {orderDetails.Instructions}</p>
                        )}
                    </div>
                )}

                {orderDetails.orderType === 'shipping' && (
                    <div>
                        <h3 className="font-semibold mb-2">Shipping Information</h3>
                        <p>Address: {orderDetails.Address}</p>
                        <p>City: {orderDetails.City}</p>
                        <p>State: {orderDetails.State}</p>
                        <p>ZIP Code: {orderDetails['Zip Code']}</p>
                        <p>Shipping Method: {orderDetails['Shipping Method']}</p>
                    </div>
                )}

                <div>
                    <h3 className="font-semibold mb-2">Items</h3>
                    <ul className="list-disc pl-5">
                        {items.map((item: any, index: number) => (
                            <li key={index}>
                                {item.name} - Quantity: {item.quantity} - ${item.total}
                                {item.variation && ` (${item.variation})`}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <p>Name: {orderDetails['Customer Name']}</p>
                    <p>Email: {orderDetails.Email}</p>
                    <p>Phone: {orderDetails.Phone}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {status === 'success' ? (
                            <>
                                <CheckCircle2 className="text-green-500" />
                                Order Confirmed
                            </>
                        ) : status === 'error' ? (
                            <>
                                <XCircle className="text-red-500" />
                                Error Processing Order
                            </>
                        ) : (
                            'Processing...'
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {status === 'loading' ? (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : status === 'success' ? (
                        renderOrderDetails()
                    ) : (
                        <div className="text-center">
                            <p className="text-red-500 mb-4">
                                There was an error processing your order. Please contact support.
                            </p>
                            <Button onClick={() => router.push('/')}>
                                Return to Home
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 