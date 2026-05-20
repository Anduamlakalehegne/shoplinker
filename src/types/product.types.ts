import type { Tables } from './database.types';

/** Product row from `public.products` (keep in sync via `database.types.ts` or `supabase gen types`). */
export type Product = Tables<'products'>;

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}
