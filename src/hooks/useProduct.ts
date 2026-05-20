'use client';

import { useQuery } from '@tanstack/react-query';
import { getProductById } from '@/services/product.service';
import { PRODUCTS_QUERY_KEY } from './useProducts';

/**
 * Hook to fetch a single product by ID.
 * Shares cache key namespace with useProducts for consistency.
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, id],
    queryFn: () => getProductById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
