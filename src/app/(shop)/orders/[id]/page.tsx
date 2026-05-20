import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { OrderDetailContent } from './OrderDetailContent';

function OrderDetailFallback() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<OrderDetailFallback />}>
      <OrderDetailContent />
    </Suspense>
  );
}
