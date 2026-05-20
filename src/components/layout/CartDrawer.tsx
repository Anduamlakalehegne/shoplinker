'use client';

import { useState } from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore, selectTotalPrice } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { useCartCatalogSync } from '@/hooks/useCartCatalogSync';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils/money';
import { cn } from '@/lib/utils/cn';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export function CartDrawer() {
  useCartCatalogSync();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const { isCartOpen, closeCart } = useUIStore();
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);

  const totalPrice = useCartStore(selectTotalPrice);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300',
          isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
        onKeyDown={(e) => e.key === 'Escape' && closeCart()}
        role="presentation"
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-out',
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Your Cart</h2>
            {items.length > 0 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground opacity-50" />
              <div>
                <p className="text-foreground font-medium">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Add some products to get started</p>
              </div>
              <Link href="/" onClick={closeCart}>
                <Button variant="outline" size="sm">
                  Browse Products
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map(({ product, quantity }) => (
                <li
                  key={product.id}
                  className="flex gap-4 rounded-xl bg-muted/50 p-3 border border-border"
                >
                  {/* Product Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-white border border-border">
                    <Image
                      src={product.image_url.split(',')[0]}
                      alt={product.name}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-foreground">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.stock_qty}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="cursor-pointer text-destructive hover:text-destructive/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded"
                        aria-label={`Remove ${product.name} from cart`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Subtotal</span>
              <span className="text-xl font-bold text-foreground">{formatPrice(totalPrice)}</span>
            </div>
            <Link href="/checkout" onClick={closeCart} className="block">
              <Button className="w-full" size="lg">
                Proceed to Checkout
              </Button>
            </Link>
            <button
              onClick={() => setIsClearCartModalOpen(true)}
              className="w-full cursor-pointer text-xs text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Clear cart
            </button>
          </div>
        )}
      </aside>

      <ConfirmModal
        isOpen={isClearCartModalOpen}
        onClose={() => setIsClearCartModalOpen(false)}
        onConfirm={clearCart}
        title="Clear Cart"
        description="Are you sure you want to remove all items from your cart? This action cannot be undone."
        confirmText="Clear cart"
        cancelText="Cancel"
        isDestructive={true}
      />
    </>
  );
}
