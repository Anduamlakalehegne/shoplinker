'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getProducts, getProductCategories, getProductCount } from '@/services/product.service';
import { ProductFilters } from '@/types/product.types';

export const PRODUCTS_QUERY_KEY = 'products';
export const PRODUCTS_COUNT_QUERY_KEY = 'products-count';
export const CATEGORIES_QUERY_KEY = 'product-categories';

const PAGE_SIZE = 12;

/**
 * Hook to fetch products with infinite scroll / "Load More" pagination.
 * Uses TanStack Query's useInfiniteQuery to append pages without layout shift.
 */
export function useProducts(filters?: Omit<ProductFilters, 'page' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: [PRODUCTS_QUERY_KEY, filters],
    queryFn: ({ pageParam = 0 }) =>
      getProducts({ ...filters, page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      // If the last page returned a full set, there are likely more pages
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch the total count of products matching the current filters.
 * Fires a lightweight Supabase HEAD request (no row data transferred).
 * Run automatically in parallel with the first page fetch inside ProductGrid.
 */
export function useProductCount(filters?: Omit<ProductFilters, 'page' | 'limit'>) {
  return useQuery({
    queryKey: [PRODUCTS_COUNT_QUERY_KEY, filters],
    queryFn: () => getProductCount(filters),
    staleTime: 1000 * 60 * 5, // same window as products
  });
}

/**
 * Hook to fetch distinct product categories for filter UI.
 */
export function useProductCategories() {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY],
    queryFn: getProductCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes — categories rarely change
  });
}
