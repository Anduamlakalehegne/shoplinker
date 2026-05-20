import { Product } from './product.types';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  /** Merge latest product rows (price, stock) from Supabase into the cart. */
  hydrateProductSnapshots: (freshProducts: Product[]) => void;
}
