import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import axiosInstance from '@/lib/axios/starpayAxios';
import { getAppUrl, requireStarPayConfig } from '@/lib/starpay/config';
import { amountsMatch } from '@/lib/utils/money';
import { paymentInitializeBodySchema } from '@/lib/validations/payment-api';
import type { OrderForPaymentInit, OrderStatus } from '@/types/order.types';

function getProductName(
  product: { name: string } | { name: string }[] | null | undefined
): string {
  if (!product) return 'Product';
  if (Array.isArray(product)) return product[0]?.name ?? 'Product';
  return product.name;
}

/**
 * POST /api/payment/initialize
 *
 * Server-side StarPay payment initialization.
 * Order total and line items are loaded from the database — never trusted from the client.
 * Test phone: 0900000000 or +251900000000 (enforced server-side).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    let body: Awaited<ReturnType<typeof paymentInitializeBodySchema.validate>>;
    try {
      body = await paymentInitializeBodySchema.validate(json, { abortEarly: false, stripUnknown: true });
    } catch (err) {
      console.warn('[payment/initialize] validation', err);
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const { orderId, amount, email, firstName, lastName } = body;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        id,
        total_amount,
        status,
        phone,
        order_items (
          product_id,
          quantity,
          unit_price,
          product:products ( name )
        )
      `
      )
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const o = order as OrderForPaymentInit;

    const orderStatus = o.status as OrderStatus;

    if (orderStatus !== 'pending') {
      const statusMessages: Partial<Record<OrderStatus, string>> = {
        paid: 'This order has already been paid',
        failed: 'This order payment has failed',
        cancelled: 'This order has been cancelled',
      };
      return NextResponse.json(
        { message: statusMessages[orderStatus] ?? 'Order is not payable' },
        { status: 409 }
      );
    }

    if (!amountsMatch(amount, o.total_amount)) {
      return NextResponse.json(
        { message: 'Payment amount does not match order total' },
        { status: 400 }
      );
    }

    const orderItems = o.order_items ?? [];
    if (orderItems.length === 0) {
      return NextResponse.json({ message: 'Order has no items' }, { status: 400 });
    }

    const starPayConfig = requireStarPayConfig();
    if (!starPayConfig) {
      return NextResponse.json(
        { message: 'STARPAY_API_KEY and STARPAY_BASE_URL must be configured' },
        { status: 500 }
      );
    }

    const { apiKey, baseUrl } = starPayConfig;
    const appUrl = getAppUrl();
    const customerName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Customer';
    // Enforced by Technical Challenge: "Use 0900000000 for testing purposes, 
    // using real customer phone numbers might result in real money deduction."
    const targetPhone = '+251900000000';
    
    const authorizedAmount = Number(o.total_amount);

    const starPayPayload = {
      amount: authorizedAmount,
      description: `ShopLinker — Order #${orderId.slice(0, 8).toUpperCase()}`,
      currency: 'ETB',
      customerName,
      customerPhoneNumber: targetPhone,
      items: orderItems.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
        item_name: getProductName(item.product),
        unit_price: Number(item.unit_price),
      })),
      callbackURL: appUrl.includes('localhost') ? undefined : `${appUrl}/api/payment/webhook`,
      redirectUrl: `${appUrl}/orders/${orderId}?payment=success`,
      customerEmail: user.email ?? email ?? undefined,
      expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      metadata: {
        order_id: orderId,
        user_id: user.id,
        order_reference: `ELS-${orderId.slice(0, 8).toUpperCase()}`,
      },
    };

    const starPayResponse = await axiosInstance.post(
      `${baseUrl}/trdp/order`,
      starPayPayload,
      { headers: { 'x-api-secret': apiKey, 'Content-Type': 'application/json' } }
    );

    const responseData = starPayResponse.data;
    if (responseData?.status !== 'success' || !responseData?.data) {
      console.error('[StarPay] Error response:', JSON.stringify(responseData));
      return NextResponse.json(
        {
          message:
            responseData?.error?.message ?? responseData?.message ?? 'Payment gateway error',
        },
        { status: 502 }
      );
    }

    const { order_id: starPayOrderId, payment_url } = responseData.data;
    if (!payment_url) {
      console.error('[StarPay] Missing payment_url:', JSON.stringify(responseData));
      return NextResponse.json({ message: 'No payment URL returned from gateway' }, { status: 502 });
    }

    const admin = await createAdminClient();
    const { error: refError } = await admin
      .from('orders')
      .update({ payment_ref: starPayOrderId })
      .eq('id', orderId)
      .eq('user_id', user.id);

    if (refError) {
      console.error('[Payment Initialize] Failed to persist payment_ref:', refError.message);
      return NextResponse.json({ message: 'Failed to save payment reference' }, { status: 500 });
    }

    return NextResponse.json({ checkout_url: payment_url, tx_ref: starPayOrderId }, { status: 200 });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as { error?: { message?: string }; message?: string };
      const msg = data?.error?.message ?? data?.message ?? error.message;

      console.error(`[Payment Initialize Error] StarPay HTTP ${status}:`, JSON.stringify(data));
      return NextResponse.json({ message: msg }, { status: 502 });
    }

    const message = error instanceof Error ? error.message : 'Payment initialization failed';
    console.error('[Payment Initialize Error] Unknown:', message);
    return NextResponse.json({ message: 'Payment initialization failed' }, { status: 500 });
  }
}
