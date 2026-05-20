import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2 text-xl font-bold transition-opacity hover:opacity-90">
              <Image
                src="/logo.png"
                alt="ShopLinker"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
              <span className="gradient-text">ShopLinker</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Premium products curated for the discerning shopper. Quality you can trust.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Shop</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Account</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Order History
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ShopLinker. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
