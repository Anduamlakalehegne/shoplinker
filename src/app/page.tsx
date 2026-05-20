import { ProductGrid } from '@/components/products/ProductGrid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShopLinker — Premium E-Commerce',
  description:
    'Discover premium products at ShopLinker. Electronics, fashion, and more — shipped securely to your door.',
};

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-2 md:px-4 py-8">
      <div className="mb-8 animate-in fade-in slide-in-from-top duration-700">
        <h1 className="mb-2 text-4xl font-bold text-foreground text-pretty">All Products</h1>
        <p className="text-muted-foreground">
          Discover our curated collection of premium products
        </p>
      </div>
      <div className="animate-in fade-in slide-in-from-top delay-100 duration-700">
        <ProductGrid />
      </div>
    </div>
  );
}
