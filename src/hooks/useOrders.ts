'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getUserOrders, getOrderById, getUserOrderStats } from '@/services/order.service';
import type { OrderStatus } from '@/types/order.types';

export const ORDERS_QUERY_KEY = 'orders';
export const ORDER_STATS_QUERY_KEY = 'order-stats';

export function useOrders(statusFilter: 'all' | OrderStatus = 'all') {
  return useInfiniteQuery({
    queryKey: [ORDERS_QUERY_KEY, statusFilter],
    queryFn: ({ pageParam = 0 }) => getUserOrders(pageParam, 10, statusFilter),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: [ORDER_STATS_QUERY_KEY],
    queryFn: getUserOrderStats,
    staleTime: 1000 * 60 * 2,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY, orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 1,
  });
}
