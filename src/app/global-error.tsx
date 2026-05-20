'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import './globals.css';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

/**
 * Root-level error UI when the root layout fails. Must define its own <html> and <body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global error boundary]', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-4 py-16 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              ShopLinker hit a critical error. Please refresh the page or try again in a moment.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
            >
              Try again
            </button>
            <Link href="/" className={cn(buttonVariants({ variant: 'outline', size: 'md' }))}>
              Back to home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
