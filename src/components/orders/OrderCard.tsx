'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Package,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/money';
import type { Order, OrderStatus } from '@/types/order.types';

const STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    variant: 'success' | 'warning' | 'danger' | 'default';
    icon: typeof CheckCircle2;
  }
> = {
  paid: { label: 'Paid', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  failed: { label: 'Failed', variant: 'danger', icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'default', icon: Ban },
};

function formatOrderDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function getItemSummary(order: Order) {
  const items = order.order_items ?? [];
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const names = items
    .map((i) => i.product?.name)
    .filter(Boolean)
    .slice(0, 2) as string[];

  const label =
    names.length > 0
      ? `${names.join(', ')}${items.length > 2 ? '…' : ''}`
      : count > 0
        ? `${count} product${count !== 1 ? 's' : ''}`
        : '';

  return { count, label };
}

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const status = STATUS_META[order.status];
  const StatusIcon = status.icon;
  const { count, label } = getItemSummary(order);
  const items = order.order_items ?? [];
  const previewItems = items.slice(0, 3);
  const overflow = items.length - previewItems.length;

  return (
    <Link href={`/orders/${order.id}`} className="group block">
      <article
        className={cn(
          'relative overflow-hidden rounded-2xl border border-border bg-card/80 p-4 sm:p-5',
          'backdrop-blur-sm transition-all duration-300',
          'hover:border-primary/35 hover:bg-card hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5'
        )}
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <section className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <section className="flex items-start gap-4 sm:flex-1 sm:min-w-0">
            <section className="flex shrink-0 items-center">
              {previewItems.length > 0 ? (
                <section className="flex -space-x-2.5">
                  {previewItems.map((item) => (
                    <figure
                      key={item.id}
                      className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-card bg-muted shadow-sm ring-1 ring-border"
                    >
                      {item.product?.image_url ? (
                        <Image
                          src={item.product.image_url.split(',')[0]}
                          alt={item.product.name ?? 'Product'}
                          fill
                          className="object-contain p-1 bg-white"
                          sizes="48px"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </span>
                      )}
                    </figure>
                  ))}
                  {overflow > 0 && (
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-xl border-2 border-card bg-muted text-xs font-semibold text-muted-foreground ring-1 ring-border">
                      +{overflow}
                    </span>
                  )}
                </section>
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <Package className="h-5 w-5 text-primary" />
                </span>
              )}
            </section>

            <section className="min-w-0 flex-1">
              <header className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground tracking-tight">
                  #{order.id.slice(0, 8).toUpperCase()}
                </h3>
                <Badge variant={status.variant} className="gap-1 pr-2.5">
                  <StatusIcon className="h-3 w-3" aria-hidden />
                  {status.label}
                </Badge>
              </header>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatOrderDate(order.created_at)}
                {count > 0 && <span className="text-muted-foreground/60"> · </span>}
                {count > 0 && <span>{count} item{count !== 1 ? 's' : ''}</span>}
              </p>
              {label && (
                <p className="mt-1.5 line-clamp-1 text-sm text-foreground/70">{label}</p>
              )}
            </section>
          </section>

          <footer className="flex items-center justify-between gap-4 border-t border-border pt-4 sm:border-t-0 sm:pt-0 sm:flex-col sm:items-end sm:shrink-0">
            <span className="sm:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="text-xl font-bold text-primary tabular-nums">
                {formatPrice(order.total_amount)}
              </p>
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">
              Details
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </footer>
        </section>
      </article>
    </Link>
  );
}
