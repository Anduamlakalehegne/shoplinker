'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProductsByIds } from '@/services/product.service';
import { useCartStore } from '@/store/useCartStore';

export const CART_CATALOG_QUERY_KEY = 'cart-catalog';

/**
 * Keeps cart line items aligned with current Supabase product rows (price, stock).
 * Mounted from the cart drawer so it runs whenever the app shell is visible.
 */
export function useCartCatalogSync() {
  const items = useCartStore((s) => s.items);
  const hydrateProductSnapshots = useCartStore((s) => s.hydrateProductSnapshots);

  const ids = useMemo(
    () => [...new Set(items.map((i) => i.product.id))].sort(),
    [items]
  );

  const { data } = useQuery({
    queryKey: [CART_CATALOG_QUERY_KEY, ids],
    queryFn: () => getProductsByIds(ids),
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (data && data.length > 0) {
      hydrateProductSnapshots(data);
    }
  }, [data, hydrateProductSnapshots]);
}
