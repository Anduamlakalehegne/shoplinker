'use client';

import { useParams, useRouter, notFound } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, ArrowLeft, Package, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useProduct } from '@/hooks/useProduct';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { StarRating } from '@/components/products/StarRating';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { formatPrice } from '@/lib/utils/money';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: product, isLoading, isError } = useProduct(params.id as string);
  const { addItem } = useCartStore();
  const { openCart } = useUIStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    toast.success(`${quantity}× ${product.name} added to cart`, {
      action: { label: 'View Cart', onClick: openCart },
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <Skeleton className="mb-8 h-5 w-32" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image & Gallery Skeleton */}
          <div className="flex flex-col gap-4">
            <Skeleton className="h-[400px] lg:h-[500px] w-full rounded-2xl" />
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
          </div>

          {/* Info Skeleton */}
          <div className="flex flex-col">
            {/* Badges */}
            <div className="flex items-start gap-3 flex-wrap">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>

            {/* Title */}
            <Skeleton className="mt-4 h-9 w-3/4" />

            {/* Stars & Premium */}
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Price */}
            <Skeleton className="mt-4 h-10 w-40" />

            {/* Description lines */}
            <div className="mt-4 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-5 w-4/6" />
            </div>

            {/* Units available */}
            <Skeleton className="mt-4 h-5 w-32" />

            {/* Quantity Selector */}
            <div className="mt-6 flex items-center gap-3">
              <Skeleton className="h-5 w-16" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-10" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>

            {/* Add to Cart button */}
            <div className="mt-6">
              <Skeleton className="h-11 w-full sm:w-48 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    notFound();
  }

  const isOutOfStock = product.stock_qty === 0;
  const maxQty = Math.min(product.stock_qty, 10);

  /** schema.org Product JSON-LD for Google rich results */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image_url,
    category: product.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ETB',
      price: product.price.toFixed(2),
      availability: isOutOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(product.rating !== null && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.rating_count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  const images = product.image_url.split(',');

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <button
        onClick={() => router.back()}
        className="mb-8 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image & Gallery Column */}
        <div className="flex flex-col gap-4">
          <ProductImageGallery
            images={images}
            selectedImageIdx={selectedImageIdx}
            onChangeImageIdx={setSelectedImageIdx}
            alt={product.name}
            className="h-[400px] lg:h-[500px]"
          />
          
          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    selectedImageIdx === idx
                      ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'border-transparent hover:border-primary/50'
                  }`}
                  aria-label={`View product image ${idx + 1}`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    className="object-contain p-2 bg-white transition-transform duration-300 group-hover:scale-110"
                    sizes="100px"
                  />
                  {selectedImageIdx === idx && (
                    <div className="absolute inset-0 bg-primary/10" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-start gap-3 flex-wrap">
            <Badge variant="default">{product.category}</Badge>
            {isOutOfStock ? (
              <Badge variant="danger">Out of Stock</Badge>
            ) : product.stock_qty <= 5 ? (
              <Badge variant="warning">{product.stock_qty} left in stock</Badge>
            ) : (
              <Badge variant="success">In Stock</Badge>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold text-foreground">{product.name}</h1>

          <StarRating
            rating={product.rating}
            count={product.rating_count}
            size="md"
            className="mt-3"
          />

          <p className="mt-4 text-4xl font-extrabold text-primary">{formatPrice(product.price)}</p>

          <p className="mt-4 text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{product.stock_qty} units available</span>
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Quantity:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-background border border-border text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold text-foreground">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-background border border-border text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="mt-6">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              aria-label={`Add ${quantity} ${product.name} to cart`}
            >
              <ShoppingCart className="h-5 w-5" />
              {isOutOfStock ? 'Out of Stock' : `Add ${quantity} to Cart`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
