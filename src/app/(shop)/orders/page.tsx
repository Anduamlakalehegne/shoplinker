'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  CheckCircle2,
  Clock,
  Sparkles,
  Store,
  Loader2,
} from 'lucide-react';
import { useOrders, useOrderStats } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { OrderCard } from '@/components/orders/OrderCard';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/money';
import type { Order, OrderStatus } from '@/types/order.types';

type StatusFilter = 'all' | OrderStatus;

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function groupOrdersByMonth(orders: Order[]) {
  const groups = new Map<string, Order[]>();

  for (const order of orders) {
    const label = new Intl.DateTimeFormat('en-GB', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(order.created_at));

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(order);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function OrdersPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-2 md:px-4 py-8 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const {
    data,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
    isError: isOrdersError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useOrders(statusFilter);

  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError
  } = useOrderStats();

  const orders = useMemo(() => data?.pages.flat() ?? [], [data]);
  const groupedOrders = useMemo(() => groupOrdersByMonth(orders), [orders]);

  /** Sentinel element watched by IntersectionObserver for auto-scroll load. */
  const loadMoreRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-load the next page of orders when the sentinel scrolls within
   * 200 px of the viewport bottom. Avoids a full-page re-render because
   * TanStack Query merges pages immutably into the existing cache.
   */
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isOrdersLoading || isStatsLoading) {
    return <OrdersPageSkeleton />;
  }

  if (isOrdersError || isStatsError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-destructive font-medium">Failed to load orders</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  const isEmpty = (stats?.total ?? 0) === 0;
  const noFilterResults = !isEmpty && orders.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-2 md:px-4 py-8">
      <div className="animate-in fade-in slide-in-from-top duration-700">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
              Order history
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              My Orders
            </h1>
            <p className="mt-2 max-w-lg text-muted-foreground">
              Track purchases, payment status, and order details in one place.
            </p>
          </div>
          {!isEmpty && (
            <Link href="/" className="shrink-0">
              <Button variant="outline" className="gap-2">
                <Store className="h-4 w-4" />
                Continue shopping
              </Button>
            </Link>
          )}
        </header>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">No orders yet</h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              When you place your first order, it will show up here with status and tracking.
            </p>
            <Link href="/" className="mt-8">
              <Button size="lg" className="gap-2">
                <Store className="h-5 w-5" />
                Browse products
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Total orders"
                value={String(stats?.total ?? 0)}
                icon={Package}
              />
              <StatCard
                label="Paid"
                value={String(stats?.paid ?? 0)}
                icon={CheckCircle2}
                accent="primary"
              />
              <StatCard
                label="Pending"
                value={String(stats?.pending ?? 0)}
                icon={Clock}
                accent="warning"
              />
              <StatCard
                label="Total spent"
                value={formatPrice(stats?.spent ?? 0)}
                icon={Sparkles}
                accent="primary"
                compact
              />
            </div>

            {/* Filters */}
            <div
              className="mb-8 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
              role="tablist"
              aria-label="Filter orders by status"
            >
              {FILTERS.map((filter) => {
                const count = filter.id === 'all' ? (stats?.total ?? 0) : (stats?.[filter.id] ?? 0);
                if (filter.id !== 'all' && count === 0) return null;

                const isActive = statusFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setStatusFilter(filter.id)}
                    className={cn(
                      'shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                      'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'border-border bg-card/60 text-muted-foreground hover:border-primary/30 hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {filter.label}
                    <span
                      className={cn(
                        'ml-1.5 tabular-nums',
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/70'
                      )}
                    >
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/*
             * Slim loading bar — visible when switching filter tabs on a cold
             * cache (isFetching is true but isLoading is false because we have
             * stale data from a previous filter already in the cache).
             * Uses role="status" + aria-live so screen readers announce it.
             */}
            <div
              role="status"
              aria-live="polite"
              aria-label={isOrdersFetching && !isOrdersLoading ? 'Loading orders' : undefined}
              className="mb-6 h-0.5 w-full overflow-hidden rounded-full"
            >
              {isOrdersFetching && !isOrdersLoading && (
                <div className="h-full w-full animate-pulse bg-primary/60 rounded-full" />
              )}
            </div>

            {noFilterResults ? (
              <div className="rounded-2xl border border-border bg-card/50 px-6 py-16 text-center">
                <p className="font-medium text-foreground">No {statusFilter} orders</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another filter or place a new order.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setStatusFilter('all')}
                >
                  Show all orders
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                {groupedOrders.map(({ label, items }) => (
                  <section key={label}>
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {label}
                    </h2>
                    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {items.map((order) => (
                        <li key={order.id}>
                          <OrderCard order={order} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

                {/* In-place skeleton list appended below active groupings when fetching the next page */}
                {isFetchingNextPage && (
                  <div className="space-y-4">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 animate-pulse">
                      Loading next orders...
                    </h2>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination sentinel — IntersectionObserver target for auto-scroll */}
                <div ref={loadMoreRef} className="mt-8 flex justify-center pb-8">
                  {isFetchingNextPage ? null : hasNextPage ? (
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      className="min-w-[160px] gap-2"
                      aria-label="Load more orders"
                    >
                      Load more orders
                    </Button>
                  ) : orders.length >= 10 ? (
                    <p className="text-sm text-muted-foreground" aria-live="polite">
                      ✓ All orders loaded
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/*
       * Fixed floating loading pill \u2014 pinned to the bottom-center of the
       * viewport. PRIMARY loading indicator for auto-scroll on orders.
       *
       * The IntersectionObserver fires 200 px before the sentinel enters
       * view, so any spinner inside the sentinel would be offscreen.
       * This pill is always visible the moment a new page starts loading.
       */}
      {isFetchingNextPage && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-300"
          aria-live="polite"
          aria-label="Loading more orders"
          role="status"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-border bg-card/95 px-5 py-2.5 text-sm font-medium text-foreground shadow-xl backdrop-blur-md">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading more orders\u2026
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'muted',
  compact = false,
}: {
  label: string;
  value: string;
  icon: typeof Package;
  accent?: 'muted' | 'primary' | 'warning';
  compact?: boolean;
}) {
  const iconStyles = {
    muted: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/15 text-primary border-primary/20',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
  };

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'mb-3 flex h-9 w-9 items-center justify-center rounded-lg border',
          iconStyles[accent]
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-bold text-foreground tabular-nums',
          compact ? 'text-base sm:text-lg' : 'text-2xl'
        )}
      >
        {value}
      </p>
    </div>
  );
}
