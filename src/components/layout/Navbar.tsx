'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, User, Package, Store, Sun, Moon, type LucideIcon } from 'lucide-react';
import { useCartStore, selectTotalItems } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from 'next-themes';
import { useIsMounted } from '@/hooks/useIsMounted';
import { UserMenu } from '@/components/layout/UserMenu';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
  className,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 md:w-auto',
        isActive
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:brightness-110'
          : 'text-foreground/80 hover:bg-muted hover:text-foreground',
        className
      )}
    >
      <Icon
        className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-foreground' : 'text-foreground/65')}
        aria-hidden
      />
      <span>{label}</span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { isCartOpen, toggleCart, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();

  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const loading = useAuthStore((state) => state.loading);
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  // Always call the hook unconditionally (Rules of Hooks).
  // Use isMounted only to gate the rendered output, not the hook call itself.
  const totalItemsRaw = useCartStore(selectTotalItems);
  const totalItems = isMounted ? totalItemsRaw : 0;

  const isShopActive = pathname === '/' || pathname.startsWith('/products');
  const isOrdersActive = pathname.startsWith('/orders');

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Visually-hidden aria-live region — announces cart count to screen readers */}
      {isMounted && (
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {totalItems > 0
            ? `Shopping cart updated: ${totalItems} item${totalItems !== 1 ? 's' : ''}`
            : ''}
        </span>
      )}
      <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 py-2">
        <div className="flex min-h-14 items-center justify-between gap-2 sm:gap-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 shrink-0 transition-opacity hover:opacity-90"
            onClick={closeMobileMenu}
          >
            <Image
              src="/logo.png"
              alt="ShopLinker"
              width={48}
              height={48}
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
              priority
            />
            <span className="text-base font-bold text-foreground sm:text-lg truncate">ShopLinker</span>
          </Link>

          <nav
            className="hidden md:flex flex-1 items-center justify-center gap-2 lg:gap-3"
            aria-label="Main navigation"
          >
            <NavLink href="/" label="Shop" icon={Store} isActive={isShopActive} />
            {user && (
              <NavLink href="/orders" label="My Orders" icon={Package} isActive={isOrdersActive} />
            )}
          </nav>

          <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
            {isMounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={
                  theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
                }
                className="text-foreground/80 hover:text-foreground hover:bg-muted"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              aria-label={totalItems > 0 ? `Shopping cart, ${totalItems} items` : 'Shopping cart'}
              className={cn(
                'relative text-foreground/80 hover:text-foreground hover:bg-muted',
                isCartOpen && 'bg-primary/15 text-primary'
              )}
            >
              <ShoppingCart className="h-5 w-5" />
              {isMounted && totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-md">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Button>

            {isMounted && !loading && (
              <>
                {user ? (
                  <div className="ml-2 md:ml-3">
                    <UserMenu user={user} onSignOut={signOut} onNavigate={closeMobileMenu} />
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-1 ml-1 pl-1 border-l border-border">
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground/85 hover:text-foreground font-semibold"
                      >
                        <User className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden md:inline">Sign In</span>
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm" className="font-semibold">
                        <span className="hidden md:inline">Get Started</span>
                        <span className="md:hidden">Join</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden ml-0.5 text-foreground/80 hover:text-foreground"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav
            className="md:hidden border-t border-border mt-2 pt-3 pb-2 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200"
            aria-label="Mobile navigation"
          >
            <NavLink
              href="/"
              label="Shop"
              icon={Store}
              isActive={isShopActive}
              onClick={closeMobileMenu}
            />
            {user && (
              <NavLink
                href="/orders"
                label="My Orders"
                icon={Package}
                isActive={isOrdersActive}
                onClick={closeMobileMenu}
              />
            )}

            {isMounted && !loading && !user && (
              <div className="flex flex-col gap-2 border-t border-border pt-3 mt-2 sm:hidden">
                <Link href="/login" onClick={closeMobileMenu} className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-center font-semibold">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={closeMobileMenu} className="w-full">
                  <Button size="sm" className="w-full justify-center font-semibold">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
