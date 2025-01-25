import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types/cart';

interface DeliveryFeeInfo {
  fee: number;
  borough: string | null;
  freeThreshold: number;
}

interface CartStore {
  items: CartItem[];
  deliveryInfo: DeliveryFeeInfo;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string, variation?: string) => void;
  updateQuantity: (id: string, variation: string | undefined, quantity: number) => void;
  updateDeliveryInfo: (info: DeliveryFeeInfo) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryInfo: {
        fee: 0,
        borough: null,
        freeThreshold: 0
      },

      addItem: (item) => {
        if (!item.id) {
          console.error('Attempted to add invalid item to cart:', item);
          return;
        }

        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) => i.id === item.id &&
              ((!i.selectedVariation && !item.selectedVariation) ||
                (i.selectedVariation?.name === item.selectedVariation?.name))
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += 1;
            // Ensure price is always correct even for existing items
            newItems[existingItemIndex].price = item.selectedVariation?.price ?? item.price ?? 0;
            return { items: newItems };
          }

          return {
            items: [...state.items, {
              ...item,
              price: item.selectedVariation?.price ?? item.price ?? 0,
              quantity: 1
            }],
          };
        });
      },

      removeItem: (id, variation) => {
        if (!id) return;

        set((state) => ({
          items: state.items.filter((item) =>
            !(item.id === id &&
              ((!item.selectedVariation && !variation) ||
                (item.selectedVariation?.name === variation)))
          ),
        }));
      },

      updateQuantity: (id, variation, quantity) => {
        if (!id) return;

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id &&
              ((!item.selectedVariation && !variation) ||
                (item.selectedVariation?.name === variation))
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      updateDeliveryInfo: (info) => {
        set({ deliveryInfo: info });
      },

      clearCart: () => set({ 
        items: [],
        deliveryInfo: {
          fee: 0,
          borough: null,
          freeThreshold: 0
        }
      }),

      getItemCount: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        const state = get();
        return state.items.reduce((total, item) => {
          const itemPrice = item.selectedVariation?.price ?? item.price ?? 0;
          return total + (itemPrice * item.quantity);
        }, 0);
      },

      getDeliveryFee: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        if (!state.deliveryInfo.borough || subtotal >= state.deliveryInfo.freeThreshold) {
          return 0;
        }
        return state.deliveryInfo.fee;
      },

      getTotal: () => {
        const state = get();
        return state.getSubtotal() + state.getDeliveryFee();
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
