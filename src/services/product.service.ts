import { createClient } from '@/lib/supabase/client';
import type { Product, ProductFilters } from '@/types/product.types';

/**
 * Product service — all Supabase product queries.
 * Used by TanStack Query hooks, never called directly from components.
 */

const PAGE_SIZE = 12;

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const supabase = createClient();
  const page = filters?.page ?? 0;
  const limit = filters?.limit ?? PAGE_SIZE;
  const from = page * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export async function getProductById(id: string): Promise<Product> {
  const supabase = createClient();
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Product not found');
  return data;
}

/** Batch fetch for cart reconciliation (current price & stock). */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase.from('products').select('*').in('id', ids);

  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

/**
 * Returns the total number of products matching the given filters.
 * Uses `head: true` so Supabase issues a lightweight HEAD request —
 * no row data is transferred, only the `Content-Range` header count.
 * Run in parallel with the first page fetch for zero extra latency.
 */
export async function getProductCount(
  filters?: Omit<ProductFilters, 'page' | 'limit'>
): Promise<number> {
  const supabase = createClient();

  // head: true → only fetch the count, not the rows (very cheap)
  let query = supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getProductCategories(): Promise<string[]> {
  const supabase = createClient();

  // Try using the efficient distinct RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_distinct_categories');

  if (!rpcError && rpcData) {
    return (rpcData as { category: string }[]).map(d => d.category);
  }

  // Fallback if the RPC hasn't been deployed yet
  const { data, error } = await supabase.from('products').select('category');

  if (error) throw new Error(error.message);

  const categories = [...new Set((data ?? []).map((p) => p.category))];
  return categories as string[];
}
