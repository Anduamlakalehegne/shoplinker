import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStarPayConfig } from '@/lib/starpay/config';
import { starpayWebhookPayloadSchema } from '@/lib/validations/payment-api';

/**
 * POST /api/payment/webhook
 * StarPay callback — verifies HMAC signature and updates order status.
 */
export async function POST(request: NextRequest) {
  try {
    const starPayConfig = requireStarPayConfig();
    if (!starPayConfig) {
      return NextResponse.json({ message: 'Payment gateway not configured' }, { status: 503 });
    }

    const { apiKey } = starPayConfig;
    const rawBody = await request.text();
    const xSignature = request.headers.get('X-Signature');
    const xTimestamp = request.headers.get('X-Timestamp');
    const isProduction = process.env.NODE_ENV === 'production';

    if (!xSignature || !xTimestamp) {
      if (isProduction) {
        console.warn('[Webhook] Missing signature headers in production');
        return NextResponse.json({ message: 'Missing signature headers' }, { status: 401 });
      }
      console.warn('[Webhook] Missing signature headers — allowed in development only');
    } else {
      const signatureMessage = `${xTimestamp}.${rawBody}`;
      const expectedSignature = createHmac('sha256', apiKey)
        .update(signatureMessage)
        .digest('hex');

      if (expectedSignature !== xSignature) {
        console.warn('[Webhook] Signature mismatch — possible forged request');
        return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
      }
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }

    let webhookBody: Awaited<ReturnType<typeof starpayWebhookPayloadSchema.validate>>;
    try {
      webhookBody = await starpayWebhookPayloadSchema.validate(payload, { abortEarly: false, stripUnknown: false });
    } catch (err) {
      console.warn('[payment/webhook] validation', err);
      return NextResponse.json({ message: 'Invalid webhook payload' }, { status: 400 });
    }

    const { billRefNo, status, message } = webhookBody;

    const orderStatus = ['PAID', 'SETTLED'].includes(status.toUpperCase())
      ? 'paid'
      : status.toUpperCase() === 'FAILED'
        ? 'failed'
        : 'pending';

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('orders')
      .update({ status: orderStatus })
      .eq('payment_ref', billRefNo)
      .select('id');

    if (error) {
      console.error('[Webhook] DB update failed:', error.message);
      return NextResponse.json({ message: 'Failed to update order' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.warn(`[Webhook] No order found with payment_ref: ${billRefNo}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log(`[Webhook] Order ${billRefNo} → status: ${orderStatus} (${message ?? status})`);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Webhook processing failed';
    console.error('[Webhook Error]', msg);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
