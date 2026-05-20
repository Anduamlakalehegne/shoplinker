'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams, notFound } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  CreditCard,
  FileText,
  Copy,
  Store,
  ShoppingBag,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useOrder } from '@/hooks/useOrders';
import { usePaymentVerify } from '@/hooks/usePaymentVerify';
import { useCartStore } from '@/store/useCartStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/money';
import { OrderStatus } from '@/types/order.types';

// ── Status configuration ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  OrderStatus,
  {
    variant: 'success' | 'warning' | 'danger' | 'default';
    icon: React.ReactNode;
    label: string;
    heroIcon: React.ReactNode;
    heroText: string;
    heroBg: string;
    heroBorder: string;
  }
> = {
  paid: {
    variant: 'success',
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'Paid',
    heroIcon: (
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30 shadow-xl shadow-primary/20">
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </div>
    ),
    heroText: 'Payment Successful!',
    heroBg: 'from-primary/8 via-background to-background',
    heroBorder: 'border-primary/20',
  },
  pending: {
    variant: 'warning',
    icon: <Clock className="h-4 w-4" />,
    label: 'Awaiting Payment',
    heroIcon: (
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border-2 border-amber-500/30 shadow-xl shadow-amber-500/20">
        <Clock className="h-10 w-10 text-amber-500" />
      </div>
    ),
    heroText: 'Payment Pending',
    heroBg: 'from-amber-500/8 via-background to-background',
    heroBorder: 'border-amber-500/20',
  },
  failed: {
    variant: 'danger',
    icon: <XCircle className="h-4 w-4" />,
    label: 'Payment Failed',
    heroIcon: (
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border-2 border-destructive/30 shadow-xl shadow-destructive/20">
        <XCircle className="h-10 w-10 text-destructive" />
      </div>
    ),
    heroText: 'Payment Failed',
    heroBg: 'from-destructive/8 via-background to-background',
    heroBorder: 'border-destructive/20',
  },
  cancelled: {
    variant: 'default',
    icon: <XCircle className="h-4 w-4" />,
    label: 'Cancelled',
    heroIcon: (
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border-2 border-border">
        <XCircle className="h-10 w-10 text-muted-foreground" />
      </div>
    ),
    heroText: 'Order Cancelled',
    heroBg: 'from-muted/50 via-background to-background',
    heroBorder: 'border-border',
  },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function OrderDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-6 animate-pulse">
      <Skeleton className="h-5 w-32" />
      {/* Hero */}
      <div className="rounded-3xl border border-border bg-card p-10 flex flex-col items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-5 w-72" />
      </div>
      {/* Transaction */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      {/* Items */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-36" />
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Detail row ────────────────────────────────────────────────────────────────
function DetailRow({
  label,
  value,
  isBold = false,
  copyable = false,
}: {
  label: string;
  value: string;
  isBold?: boolean;
  copyable?: boolean;
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn('text-sm text-right', isBold ? 'font-bold text-foreground' : 'text-foreground')}>
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-primary transition-colors p-1 rounded"
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function OrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();

  const isSuccessRedirect = searchParams.get('payment') === 'success';
  const orderId = params.id as string;

  const { data: order, isLoading: isOrderLoading, isError } = useOrder(orderId);
  const shouldVerify = Boolean(order?.status === 'pending' && isSuccessRedirect);
  const { isFetching: isVerifying } = usePaymentVerify(orderId, shouldVerify);

  useEffect(() => {
    if (order?.status === 'paid' && isSuccessRedirect) {
      clearCart();
    }
  }, [order?.status, isSuccessRedirect, clearCart]);

  if (isOrderLoading || isVerifying) return <OrderDetailSkeleton />;

  if (isError || !order) {
    notFound();
  }

  const status = STATUS_CONFIG[order.status];
  const isPaid = order.status === 'paid';
  const orderRef = order.id.slice(0, 8).toUpperCase();
  const paymentRef = order.payment_ref ?? null;
  const orderDate = new Date(order.created_at);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
        {/* Back button */}
        <button
          onClick={() => router.push('/orders')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to orders
        </button>

        {/* ── Hero Banner ── */}
        <div
          className={cn(
            'relative overflow-hidden rounded-3xl border bg-gradient-to-b p-10 text-center',
            status.heroBg,
            status.heroBorder
          )}
        >
          {/* Decorative blobs */}
          <div aria-hidden="true" className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-4">
            {status.heroIcon}
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {status.heroText}
              </h1>
              {isPaid && (
                <p className="mt-2 text-muted-foreground text-sm">
                  Thank you for your purchase! Your order has been confirmed.
                </p>
              )}
            </div>

            {/* Big amount */}
            <div className="mt-2">
              <Badge variant={status.variant} className="mb-3 text-xs uppercase tracking-wider px-3">
                {status.label}
              </Badge>
              <p className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
                {formatPrice(order.total_amount)}
              </p>
            </div>

            {/* Order ID pill */}
            <div className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 backdrop-blur-sm">
              <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-mono font-medium text-foreground">Order #{orderRef}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(orderRef); toast.success('Order ID copied'); }}
                aria-label="Copy order ID"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left column — Transaction + Delivery */}
          <div className="space-y-6 lg:col-span-3">
            {/* Transaction Details */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-6 py-4">
                <CreditCard className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Transaction Details</h2>
              </div>
              <div className="divide-y divide-border px-6">
                <DetailRow label="Status" value={status.label} />
                <DetailRow
                  label="Order Date"
                  value={orderDate.toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                />
                {paymentRef && (
                  <DetailRow
                    label="Transaction Reference"
                    value={paymentRef}
                    copyable
                  />
                )}
                <DetailRow label="Payment Channel" value="StarPay" />
                <DetailRow label="Currency" value="ETB" />
                <div className="flex items-center justify-between gap-4 py-4 mt-1">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-extrabold text-primary">{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-6 py-4">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Delivery Details</h2>
              </div>
              <div className="divide-y divide-border px-6">
                <DetailRow label="Delivery Address" value={order.delivery_address} />
                <DetailRow label="Phone Number" value={order.phone} />
                {(order as { order_notes?: string | null }).order_notes && (
                  <div className="py-3 space-y-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Order Notes
                    </span>
                    <p className="text-sm text-foreground bg-muted/50 rounded-xl px-3 py-2 mt-1 italic">
                      {(order as { order_notes?: string | null }).order_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column — Items */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-6 py-4">
                <Package className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">
                  Items Ordered
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    ({order.order_items?.length ?? 0})
                  </span>
                </h2>
              </div>
              <ul className="divide-y divide-border px-4">
                {order.order_items?.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-4">
                    {item.product?.image_url && (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white border border-border">
                        <Image
                          src={item.product.image_url.split(',')[0]}
                          alt={item.product?.name ?? ''}
                          fill
                          className="object-contain p-1"
                          sizes="56px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.product?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatPrice(item.unit_price)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-foreground shrink-0">
                      {formatPrice(item.unit_price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border bg-muted/30 px-6 py-4 flex items-center justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-extrabold text-primary">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/orders" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <ShoppingBag className="h-4 w-4" />
              View all orders
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button className="w-full gap-2">
              <Store className="h-4 w-4" />
              Continue shopping
            </Button>
          </Link>
        </div>

        {/* Phone icon for pending */}
        {!isPaid && order.status === 'pending' && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-5 py-4 text-sm">
            <Phone className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-800 dark:text-amber-300">
              Your payment is being processed. You&apos;ll receive a confirmation once it clears.
              Check your phone for a StarPay prompt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
