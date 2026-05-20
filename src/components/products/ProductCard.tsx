'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/types/product.types';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { StarRating } from '@/components/products/StarRating';
import { formatPrice } from '@/lib/utils/money';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { openCart } = useUIStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} added to cart`, {
      action: { label: 'View Cart', onClick: openCart },
    });
  };

  const isOutOfStock = product.stock_qty === 0;
  const isLowStock = product.stock_qty > 0 && product.stock_qty <= 5;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block cursor-pointer"
      aria-label={`View ${product.name} — ${formatPrice(product.price)}`}
    >
      <article className="relative overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-0.5">

        {/* ── Image Container ── */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.image_url.split(',')[0]}
            alt={product.name}
            fill
            priority={priority}
            className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="(max-width: 640px) calc(100vw - 16px), (max-width: 1024px) calc(50vw - 24px), (max-width: 1280px) calc(33vw - 28px), min(350px, calc((min(100vw, 1400px) - 88px) / 4))"
          />

          {/* Gradient overlay for text readability */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />



          {/* Category chip — top right */}
          <div className="absolute right-2.5 top-2.5">
            <span className="rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm backdrop-blur-md">
              {product.category}
            </span>
          </div>



          {/* Hover action overlay */}
          <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 pb-4 transition-transform duration-300 group-hover:translate-y-0">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              aria-label={`Add ${product.name} to cart`}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
              {isOutOfStock ? 'Sold Out' : 'Quick Add'}
            </button>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg backdrop-blur-sm"
              aria-hidden="true"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex flex-col gap-3 p-4">
          {/* Product name */}
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
            {product.name}
          </h3>

          {/* Star rating */}
          <StarRating
            rating={product.rating}
            count={product.rating_count}
            size="sm"
          />

          {/* Price row */}
          <div className="mt-1 flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-xl font-extrabold tracking-tight text-primary leading-none">
                {formatPrice(product.price)}
              </p>

              {/* Inline add button — always visible on mobile/touch, hidden on desktop (covered by hover overlay) */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                aria-label={`Add ${product.name} to cart`}
                className="sm:hidden flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingCart className="h-3 w-3" aria-hidden />
                {isOutOfStock ? 'Sold Out' : 'Add'}
              </button>

              {/* Desktop: pill-style add button below image hover overlay, visible when not hovering on small desktop */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                aria-label={`Add ${product.name} to cart`}
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground group-hover:opacity-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingCart className="h-3 w-3" aria-hidden />
                {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
              </button>
            </div>

            <div className="h-3 mt-1.5">
              {isOutOfStock && (
                <p className="text-[11px] font-bold uppercase tracking-wide text-destructive leading-none">Out of Stock</p>
              )}
              {isLowStock && (
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-500 leading-none">Only {product.stock_qty} left</p>
              )}
            </div>
          </div>
        </div>


      </article>
    </Link>
  );
}
