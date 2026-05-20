import type { Metadata } from 'next';
import { Rubik, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';

const rubik = Rubik({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-rubik',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ShopLinker — Premium E-Commerce',
    template: '%s | ShopLinker',
  },
  description:
    'Discover premium products at ShopLinker. Browse, shop, and pay securely with StarPay.',
  keywords: ['e-commerce', 'shopping', 'online store', 'Ethiopia'],
  openGraph: {
    type: 'website',
    title: 'ShopLinker',
    description: 'Premium products curated for the discerning shopper.',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${rubik.variable} ${nunitoSans.variable} font-sans bg-background text-foreground antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
