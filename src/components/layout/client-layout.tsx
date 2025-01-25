'use client';

import { Navigation } from '@/components/layout/Navigation';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/store/cart';
import { CartModal } from '@/features/cart/components/cart-modal';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const isStorePage = pathname?.startsWith('/store');
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <>
      <Navigation 
        searchQuery={isStorePage ? searchQuery : ''} 
        onSearchChange={isStorePage ? setSearchQuery : () => {}} 
      >
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ShoppingCart className="h-6 w-6 text-gray-900 dark:text-gray-100" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </button>
      </Navigation>
      <CartModal open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <main className="container mx-auto px-4 pt-20">
        {children}
      </main>
    </>
  );
} 