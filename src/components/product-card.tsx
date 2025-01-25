'use client';

import { Product, ProductVariation } from '@/types/product';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from '@/lib/store/cart';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedVariation, setSelectedVariation] = useState<string | undefined>();
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  // Get active variations with valid prices
  const validVariations = product.variations?.filter(v => 
    v.name && 
    v.name.trim() !== '' && 
    v.isActive && 
    typeof v.price === 'number' && 
    v.price > 0
  ) || [];

  // Get the selected variation object
  const currentVariation = validVariations.find(v => v.name === selectedVariation);

  const handleAddToCart = () => {
    if (!currentVariation) return;
    
    setIsAdding(true);
    addItem({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      selectedVariation: {
        name: currentVariation.name,
        price: currentVariation.price || 0
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name}${selectedVariation ? ` - ${selectedVariation}` : ''} has been added to your cart.`,
    });
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="flex-none p-2 sm:p-3">
        {product.imageUrl && (
          <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-100">
            {product.imageUrl.startsWith('data:image') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            )}
          </div>
        )}
        <CardTitle className="text-sm sm:text-base font-semibold mt-2 line-clamp-1">{product.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-2 sm:p-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        {currentVariation && (
          <p className="mt-1.5 text-sm sm:text-base font-semibold">${(currentVariation.price || 0).toFixed(2)}</p>
        )}
      </CardContent>
      <CardFooter className="flex-none p-2 pb-2.5 sm:p-3 space-y-1">
        {validVariations.length > 0 && (
          <div className="w-full">
            <Select value={selectedVariation} onValueChange={setSelectedVariation}>
              <SelectTrigger className="w-full h-6 text-[11px] min-h-[24px] px-2">
                <SelectValue placeholder="Select variation" />
              </SelectTrigger>
              <SelectContent>
                {validVariations.map((variation) => (
                  <SelectItem 
                    key={variation.name} 
                    value={variation.name}
                    className="text-[11px] h-6 min-h-[24px]"
                  >
                    {variation.name} - ${(variation.price || 0).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="w-full">
          <Button 
            onClick={handleAddToCart} 
            className="w-full h-6 text-[11px] min-h-[24px] px-2 relative"
            disabled={!currentVariation || isAdding}
            variant="white"
          >
            <div className="flex items-center justify-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              <span className="truncate">Add to Cart</span>
            </div>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
