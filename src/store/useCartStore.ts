import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartState } from '@/types/cart.types';
import { Product } from '@/types/product.types';

/**
 * Cart Zustand store with localStorage persistence.
 * This is the ONLY place cart mutation logic lives (separation of concerns).
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((item) => item.product.id === product.id);

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock_qty) }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { product, quantity: Math.min(quantity, product.stock_qty) }],
          };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      hydrateProductSnapshots: (freshProducts: Product[]) => {
        if (freshProducts.length === 0) return;
        set((state) => ({
          items: state.items
            .map((item) => {
              const fresh = freshProducts.find((p) => p.id === item.product.id);
              if (!fresh) return item;
              if (fresh.stock_qty <= 0) return null;
              const quantity = Math.min(item.quantity, fresh.stock_qty);
              if (quantity <= 0) return null;
              return { product: fresh, quantity };
            })
            .filter((entry): entry is { product: Product; quantity: number } => entry !== null),
        }));
      },
    }),
    {
      name: 'shoplinker-cart',
      storage: createJSONStorage(() => localStorage),
      // Only persist the items array, not the action methods
      partialize: (state) => ({ items: state.items }),
    }
  )
);

/**
 * Standalone selectors for derived cart values.
 * Kept outside the store so they are pure functions with no Zustand coupling —
 * the idiomatic Zustand pattern for computed/derived state.
 */
export const selectTotalItems = (state: CartState): number =>
  state.items.reduce((total, item) => total + item.quantity, 0);

export const selectTotalPrice = (state: CartState): number =>
  state.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
