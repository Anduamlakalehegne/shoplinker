import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import axiosInstance from '@/lib/axios/starpayAxios';
import { requireStarPayConfig } from '@/lib/starpay/config';
import { paymentVerifyBodySchema } from '@/lib/validations/payment-api';

/**
 * POST /api/payment/verify
 * Verifies payment status with StarPay after redirect (localhost fallback).
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

    let body: Awaited<ReturnType<typeof paymentVerifyBodySchema.validate>>;
    try {
      body = await paymentVerifyBodySchema.validate(json, { abortEarly: false, stripUnknown: true });
    } catch (err) {
      console.warn('[payment/verify] validation', err);
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const { ourOrderId } = body;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('payment_ref, status')
      .eq('id', ourOrderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'paid' || order.status === 'failed') {
      return NextResponse.json({ status: order.status }, { status: 200 });
    }

    if (!order.payment_ref) {
      return NextResponse.json(
        { message: 'No payment reference for this order' },
        { status: 400 }
      );
    }

    const starPayConfig = requireStarPayConfig();
    if (!starPayConfig) {
      return NextResponse.json(
        { message: 'STARPAY_API_KEY and STARPAY_BASE_URL must be configured' },
        { status: 500 }
      );
    }

    const { apiKey, baseUrl } = starPayConfig;

    const verifyResponse = await axiosInstance.post(
      `${baseUrl}/trdp/verify`,
      { orderId: order.payment_ref },
      {
        headers: {
          'x-api-secret': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const responseData = verifyResponse.data;
    const starPayStatus: string = responseData?.data?.status ?? 'PENDING';

    const orderStatus = ['PAID', 'SETTLED'].includes(starPayStatus.toUpperCase())
      ? 'paid'
      : starPayStatus.toUpperCase() === 'FAILED'
        ? 'failed'
        : 'pending';

    if (orderStatus !== order.status) {
      const admin = await createAdminClient();
      const { error: updateError } = await admin
        .from('orders')
        .update({ status: orderStatus })
        .eq('id', ourOrderId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[Payment Verify] Order status update failed:', updateError.message);
        return NextResponse.json({ message: 'Failed to update order status' }, { status: 500 });
      }
    }

    return NextResponse.json({ status: orderStatus }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    console.error('[Payment Verify Error]', message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
