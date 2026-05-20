import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/types/database.types';
import type { Order, CreateOrderPayload, OrderStatus } from '@/types/order.types';

/**
 * Order service — all Supabase order queries.
 */

export async function validateCartStock(
  items: CreateOrderPayload['items']
): Promise<void> {
  const supabase = createClient();

  const productIds = items.map((i) => i.product_id);
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, stock_qty')
    .in('id', productIds);

  if (error) {
    throw new Error('Failed to validate product stock');
  }

  const productMap = new Map(products?.map((p) => [p.id, p]) ?? []);

  for (const item of items) {
    const product = productMap.get(item.product_id);

    if (!product) {
      throw new Error('One or more products in your cart are no longer available');
    }

    if (item.quantity > product.stock_qty) {
      throw new Error(
        `"${product.name}" only has ${product.stock_qty} unit${product.stock_qty === 1 ? '' : 's'} in stock`
      );
    }

    if (product.stock_qty === 0) {
      throw new Error(`"${product.name}" is out of stock`);
    }
  }
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to place an order');

  // Attempt atomic stock decrement via RPC
  const { data: orderId, error: rpcError } = await supabase.rpc('place_order', {
    p_total_amount: payload.total_amount,
    p_delivery_address: payload.delivery_address,
    p_phone: payload.phone,
    p_order_notes: payload.order_notes ?? null,
    p_items: payload.items,
  });

  if (!rpcError && orderId) {
    return getOrderById(orderId as string);
  }

  // If the RPC failed due to insufficient stock, bubble up the error cleanly
  if (rpcError && rpcError.message.toLowerCase().includes('stock')) {
    throw new Error(rpcError.message);
  }

  // Fallback: If the RPC hasn't been deployed to Supabase yet (PGRST202 or 404),
  // fallback to the old client-side sequence to ensure the app continues working.
  await validateCartStock(payload.items);

  const insert: TablesInsert<'orders'> = {
    user_id: user.id,
    total_amount: payload.total_amount,
    status: 'pending',
    delivery_address: payload.delivery_address,
    phone: payload.phone,
    order_notes: payload.order_notes ?? null,
  };

  const { data: order, error: orderError } = await supabase.from('orders').insert(insert).select().single();

  if (orderError) throw new Error(orderError.message);
  if (!order) throw new Error('Failed to create order');

  const orderItems: TablesInsert<'order_items'>[] = payload.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw new Error(itemsError.message);

  return order as Order;
}

export async function getUserOrders(
  page = 0,
  limit = 10,
  statusFilter: 'all' | OrderStatus = 'all'
): Promise<Order[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const from = page * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('orders')
    .select(`*, order_items(*, product:products(name, image_url))`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data ?? []) as Order[];
}

export async function getUserOrderStats() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const stats = {
    total: 0,
    paid: 0,
    pending: 0,
    failed: 0,
    cancelled: 0,
    spent: 0,
  };

  // Try using the efficient RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_stats', {
    p_user_id: user.id,
  });

  if (!rpcError && rpcData) {
    for (const row of rpcData as { status: string; count: number; total_spent: number }[]) {
      stats.total += Number(row.count);
      if (row.status === 'paid') {
        stats.paid = Number(row.count);
        stats.spent = Number(row.total_spent ?? 0);
      } else if (row.status === 'pending') {
        stats.pending = Number(row.count);
      } else if (row.status === 'failed') {
        stats.failed = Number(row.count);
      } else if (row.status === 'cancelled') {
        stats.cancelled = Number(row.count);
      }
    }
    return stats;
  }

  // Fallback to JS aggregation if RPC is not deployed yet
  const { data, error } = await supabase
    .from('orders')
    .select('status, total_amount')
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  stats.total = data.length;
  for (const order of data) {
    if (order.status === 'paid') {
      stats.paid++;
      stats.spent += order.total_amount;
    } else if (order.status === 'pending') {
      stats.pending++;
    } else if (order.status === 'failed') {
      stats.failed++;
    } else if (order.status === 'cancelled') {
      stats.cancelled++;
    }
  }

  return stats;
}

export async function getOrderById(orderId: string): Promise<Order> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .select(`*, order_items(*, product:products(name, image_url))`)
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Order not found');
  return data as Order;
}
