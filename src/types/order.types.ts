import type { OrderStatusDb, Tables } from './database.types';

export type OrderStatus = OrderStatusDb;

export type OrderRow = Tables<'orders'>;
export type OrderItemRow = Tables<'order_items'>;
type ProductRow = Tables<'products'>;

/** Shape returned by `/api/payment/initialize` order select (nested `product` from FK). */
export type OrderForPaymentInit = Pick<OrderRow, 'id' | 'total_amount' | 'status' | 'phone'> & {
  order_items: Array<
    Pick<OrderItemRow, 'product_id' | 'quantity' | 'unit_price'> & {
      product: { name: string } | { name: string }[] | null;
    }
  >;
};

/** Order with optional joined line items (as returned by list/detail queries). */
export interface Order extends OrderRow {
  order_items?: (OrderItemRow & {
    product?: Pick<ProductRow, 'name' | 'image_url'> | ProductRow | null;
  })[];
}

export interface OrderItem extends OrderItemRow {
  product?: Pick<ProductRow, 'name' | 'image_url'> | ProductRow | null;
}

export interface CreateOrderPayload {
  items: { product_id: string; quantity: number; unit_price: number }[];
  total_amount: number;
  delivery_address: string;
  phone: string;
  order_notes?: string;
}
