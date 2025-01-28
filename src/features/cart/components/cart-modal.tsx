'use client';

import { useCart } from '@/lib/store/cart';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Minus, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CartModalProps {
  open: boolean;
  onClose: () => void;
}

export function CartModal({ open, onClose }: CartModalProps) {
  const router = useRouter();
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getItemCount,
    getSubtotal,
    getDeliveryFee,
    getTotal,
    deliveryInfo
  } = useCart();
  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  const handleQuantityChange = (itemId: string, variation: string | undefined, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId, variation);
    } else {
      updateQuantity(itemId, variation, newQuantity);
    }
  };

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader className="space-y-2.5">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({itemCount} items)
            </SheetTitle>
            {itemCount > 0 && (
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => clearCart()}
              >
                Clear Cart
              </Button>
            )}
          </div>
        </SheetHeader>

        {itemCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-4" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 bg-muted/50 p-3 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.selectedVariation && (
                        <p className="text-sm text-muted-foreground">
                          {item.selectedVariation.name}
                        </p>
                      )}
                      <p className="text-sm font-medium">
                        {formatPrice((item.selectedVariation?.price || item.price) * item.quantity)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.id, item.selectedVariation?.name, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.id, item.selectedVariation?.name, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeItem(item.id, item.selectedVariation?.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4">
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {deliveryInfo.borough && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      {subtotal >= deliveryInfo.freeThreshold ? (
                        <Badge variant="outline" className="text-green-600">
                          Free Delivery
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Free over ${deliveryInfo.freeThreshold}
                        </Badge>
                      )}
                    </div>
                    <span>{deliveryFee > 0 ? formatPrice(deliveryFee) : 'Free'}</span>
                  </div>
                )}

                <div className="flex items-center justify-between font-medium pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <SheetFooter>
                <Button className="w-full" onClick={handleCheckout}>
                  Checkout
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
} 