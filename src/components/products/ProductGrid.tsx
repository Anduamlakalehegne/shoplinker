'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Product } from '@/types/product.types';
import { ProductCard } from './ProductCard';
import { CategoryListbox } from './CategoryListbox';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useProducts, useProductCategories, useProductCount } from '@/hooks/useProducts';

const SEARCH_DEBOUNCE_MS = 350;

export function ProductGrid() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  /** Sentinel element — IntersectionObserver watches this to trigger auto-load. */
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounce search input to avoid a query on every keystroke
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [search]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProducts({
    category: selectedCategory,
    search: debouncedSearch || undefined,
  });

  const { data: categories = [] } = useProductCategories();

  /**
   * Parallel count query — Supabase HEAD request (zero row data transferred).
   * Fires simultaneously with the first page fetch so there is no extra
   * network roundtrip. Gives us the total for "Showing X of Y" display.
   */
  const { data: totalCount } = useProductCount({
    category: selectedCategory,
    search: debouncedSearch || undefined,
  });

  // Flatten all pages into a single product list
  const products = data?.pages.flat() ?? [];

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCategory(undefined);
  };

  /**
   * Auto-load the next page when the sentinel div scrolls within 300 px of the
   * viewport. The 300 px root-margin gives the network request a head-start so
   * products appear before the user actually reaches the bottom.
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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-destructive font-medium">Failed to load products</p>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-background transition-all"
            aria-label="Search products"
          />
        </div>

        <CategoryListbox
          categories={categories}
          selectedCategory={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

      {/* Results Count */}
      {!isLoading && products.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {totalCount !== undefined ? (
            <>
              Showing <span className="font-semibold text-foreground">{products.length}</span> of{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> product
              {totalCount !== 1 ? 's' : ''}
            </>
          ) : (
            <>
              {products.length} product{products.length !== 1 ? 's' : ''} loaded
            </>
          )}
          {selectedCategory && ` in "${selectedCategory}"`}
          {(debouncedSearch || search) &&
            ` matching "${debouncedSearch || search}"`}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <ProductGridSkeleton count={12} />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground font-medium">No products found</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product: Product, index: number) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      )}

      {/* Skeleton cards appended below the visible grid while the next page loads */}
      {isFetchingNextPage && <ProductGridSkeleton count={4} />}

      {/*
       * Sentinel div — the IntersectionObserver target.
       * Always rendered below the grid so the observer can watch it.
       * Shows the manual "Load more" button when idle (accessible fallback
       * for keyboard users), and an end-of-list message when all pages
       * are loaded.
       * Note: the primary VISIBLE loading feedback is the fixed pill below —
       * this sentinel's spinner state is a secondary/redundant indicator.
       */}
      {!isLoading && (
        <div ref={loadMoreRef} className="flex justify-center pt-6 pb-2">
          {isFetchingNextPage ? null : hasNextPage ? (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              className="min-w-[160px] gap-2"
              aria-label="Load more products"
            >
              Load more products
            </Button>
          ) : products.length >= 12 ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              ✓ All products loaded
            </p>
          ) : null}
        </div>
      )}

      {/*
       * Fixed floating loading pill — pinned to the bottom-center of the
       * viewport. This is the PRIMARY loading indicator for auto-scroll.
       *
       * Because the IntersectionObserver fires 300 px before the sentinel
       * enters the viewport, the user would never see a spinner that lives
       * inside the sentinel. This pill is always on-screen regardless of
       * scroll position, giving instant visual feedback the moment a new
       * page starts loading.
       */}
      {isFetchingNextPage && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-300"
          aria-live="polite"
          aria-label="Loading more products"
          role="status"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-border bg-card/95 px-5 py-2.5 text-sm font-medium text-foreground shadow-xl backdrop-blur-md">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading more products…
          </div>
        </div>
      )}
    </div>
  );
}
