'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios/apiClient';
import { ORDERS_QUERY_KEY } from '@/hooks/useOrders';

interface VerifyPaymentResponse {
  status: string;
}

/**
 * Polls our server verify endpoint after StarPay redirect.
 * Retries every 3s until the status reaches a terminal state (paid|failed)
 * or the max retry count is exhausted.
 *
 * This handles the case where the StarPay webhook cannot reach localhost
 * (production build running locally with `npm start`) — the verify route
 * calls StarPay's API directly and is the reliable fallback.
 */
export function usePaymentVerify(orderId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['payment-verify', orderId],
    queryFn: async (): Promise<VerifyPaymentResponse> => {
      const { data } = await apiClient.post<VerifyPaymentResponse>('/api/payment/verify', {
        ourOrderId: orderId,
      });

      if (data.status === 'paid' || data.status === 'failed') {
        await queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
        if (data.status === 'paid') {
          const { useCartStore } = await import('@/store/useCartStore');
          useCartStore.getState().clearCart();
        }
      }

      return data;
    },
    enabled: Boolean(orderId && enabled),
    // Poll every 3 seconds while status is still pending.
    // Stops automatically once a terminal status (paid|failed) is received
    // and enabled flips to false when the order query is invalidated.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'paid' || status === 'failed') return false;
      return 3000;
    },
    retry: 2,
    // staleTime: 0 ensures each refetchInterval tick actually calls queryFn
    staleTime: 0,
  });
}
