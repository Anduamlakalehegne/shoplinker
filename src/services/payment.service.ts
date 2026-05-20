import apiClient from '@/lib/axios/apiClient';

/**
 * Payment service — client-side payment initiation.
 * Calls our internal Next.js API route (NOT StarPay directly).
 */

export interface InitiatePaymentPayload {
  orderId: string;
  amount: number;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface InitiatePaymentResponse {
  checkout_url: string;
  tx_ref: string;
}

export async function initiatePayment(
  payload: InitiatePaymentPayload
): Promise<InitiatePaymentResponse> {
  const { data } = await apiClient.post<InitiatePaymentResponse>(
    '/api/payment/initialize',
    payload
  );
  return data;
}
