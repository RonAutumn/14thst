import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Order {
  id: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
}

interface OrdersListProps {
  orders: Order[];
}

export const OrdersList: React.FC<OrdersListProps> = ({ orders }) => {
  return (
    <Card className="bg-gray-900 border-gray-800 p-4">
      <h2 className="text-xl font-bold mb-4 text-white">Recent Orders</h2>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200 border border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-white">Order #{order.id}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{formatCurrency(order.total)}</p>
                  <p className={`text-sm ${
                    order.status === 'completed' ? 'text-green-400' :
                    order.status === 'pending' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {order.status.toUpperCase()}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm text-gray-300"
                    >
                      <span>
                        {item.name} {item.selectedVariation?.flavor && `(${item.selectedVariation.flavor})`} x{item.quantity}
                      </span>
                      <span>
                        {formatCurrency((item.selectedVariation?.price || item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default OrdersList;
