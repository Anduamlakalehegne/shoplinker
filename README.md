# ShopLinker — Mini E-Commerce Platform

> A production-oriented mini e-commerce platform built for the Frontend Technical Challenge.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e)](https://supabase.com)

---

## 🚀 Live Demo

[https://shop-linker.vercel.app/](https://shop-linker.vercel.app/)

---

## ✨ Features

- 🔐 **Authentication** — Email/password via Supabase Auth with SSR session handling
- 🛍️ **Product Browsing** — Full-text search + category filtering with TanStack Query caching
- 📦 **Product Details** — Quantity selector, stock indicators, live add-to-cart
- 🖼️ **Touch-Safe Interactive Gallery** — Premium slider/carousel on product detail pages featuring predictive loading of adjacent slides, touch swipe support, and hardware-accelerated hover-to-zoom (automatically bypassed on touch screens to protect swipe and page scroll).
- 🌓 **Dynamic Dark Mode** — First-class default dark theme support with custom UI styling including adaptive, high-contrast navigation controls and backdrops that leverage the semantic variable system.
- 🛒 **Persistent Cart** — Zustand store with `localStorage` persistence (`shoplinker-cart` key); prices and stock are **reconciled from Supabase** when the cart loads
- 💳 **Checkout** — Multi-field form with Formik + Yup validation
- 💰 **StarPay Integration** — Server-side payment initialization (secret key never touches the browser)
- 📋 **Order History** — View all past orders with status tracking
- 📱 **Responsive** — Mobile-first design across all breakpoints

---

## 🛠️ Tech Stack

| Purpose | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + CVA |
| State Management | Zustand (client state) |
| Server State & Caching | TanStack Query |
| HTTP | Axios (with interceptors) |
| Validation | Yup (Client forms + Server API) |
| Backend | Supabase (Auth + PostgreSQL) |
| Payment | StarPay (server-side only) |
| Notifications | Sonner |
| Icons | Lucide React |

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Route group — login, register
│   ├── (shop)/             # Route group — products, checkout, orders
│   ├── api/
│   │   └── payment/
│   │       ├── initialize/ # ← StarPay server-side call
│   │       ├── verify/     # ← Post-redirect payment verification
│   │       └── webhook/    # ← Payment status callback
│   ├── error.tsx           # Route-level error UI
│   ├── global-error.tsx    # Root error UI (critical layout failures)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # Button, Input, Card, Skeleton, Badge
│   ├── layout/             # Navbar, Footer, CartDrawer
│   └── products/           # ProductCard, ProductGrid, CategoryListbox, ProductImageGallery
├── hooks/                  # TanStack Query hooks + useCartCatalogSync
├── store/                  # Zustand stores (cart, auth, UI)
├── lib/
│   ├── supabase/           # Browser + Server clients
│   ├── axios/              # Centralized instance
│   └── validations/        # Yup schemas (client + server)
├── services/               # Data abstraction layer
└── types/                  # database.types, domain + payment API inferred types
```

---

## ⚙️ Setup Instructions

### 1. Clone and install

```bash
git clone https://github.com/Anduamlakalehegne/shoplinker.git
cd shoplinker
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

STARPAY_API_KEY=your-starpay-api-key
STARPAY_BASE_URL=https://starpayqa.starpayethiopia.com/v1/starpay-api

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ `STARPAY_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are **server-only** and must NEVER be prefixed with `NEXT_PUBLIC_`.

### 3. Set up Supabase

Run the following SQL in your Supabase SQL editor:

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  stock_qty INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT NULL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  rating_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled')),
  delivery_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  payment_ref TEXT,
  order_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies (tightened: no broad FOR ALL on orders or profiles)
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Products are publicly readable" ON products FOR SELECT USING (true);

-- Orders: users may read and create their own rows only. Updates (status, payment_ref) run via
-- Next.js API routes using the service role after the caller is authenticated.
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can insert own order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
```

> **Security:** If any API keys were ever committed or shared, rotate them in the StarPay and Supabase dashboards immediately. Never commit real secrets — use `.env.local` only.

#### Database TypeScript types

`src/types/database.types.ts` defines the `Database` shape for `@supabase/supabase-js` (tables: `profiles`, `products`, `orders`, `order_items`). **Regenerate** after schema changes if you use the Supabase CLI:

```bash
npm run gen:db-types
```

(`supabase` CLI must be installed and the project linked; alternatively run `supabase gen types typescript --project-id <id> > src/types/database.types.ts`.)

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Key Architectural Decisions

### State Management Split

| State Type | Tool | Rationale |
|---|---|---|
| Server data (products, orders) | TanStack Query | Built-in caching, deduplication, background refetch |
| Cart | Zustand + `persist` | Pure client state; persists to `localStorage` (`shoplinker-cart`). **Catalog sync** (`useCartCatalogSync`) refetches product rows for cart IDs so totals match current DB price/stock |
| Auth session | Supabase SSR | Server-side cookies for hydration without flicker |
| UI toggles (drawer, menu) | Zustand | Lightweight, no persistence needed |

### StarPay Security Architecture

```
Browser → POST /api/payment/initialize (Next.js Route Handler)
                │
                ├── Verifies Supabase session
                ├── Requires STARPAY_API_KEY + STARPAY_BASE_URL
                ├── Calls StarPay API server-to-server (`/trdp/order`)
                ├── Uses STARPAY_API_KEY from process.env (never exposed to client)
                └── Returns { checkout_url } to browser

StarPay → POST /api/payment/webhook
                │
                ├── Verifies HMAC-SHA256 signature (Enforced in production, skipped in dev)
                └── Updates order status in Supabase (admin client, bypasses RLS)
```

**Why this matters**: Direct browser-to-StarPay calls would:
1. Expose the API secret key in client-side code
2. Fail because `localhost` is not whitelisted by StarPay

> ⚠️ **Webhook Security Note**: The `/api/payment/webhook` route intentionally skips HMAC signature verification when `process.env.NODE_ENV !== 'production'` to allow local testing (e.g. via Postman). Ensure Vercel is building the app in `production` mode so the signature check is strictly enforced in the live environment.

### Service Abstraction

All data access goes through `/services/`, never directly from components:
```
Component → TanStack Query Hook → Service Function → Supabase Client
```

This keeps components presentational and makes the data layer fully testable.

---

## 🔒 Security Practices

- `STARPAY_API_KEY` — server-only env var, not prefixed with `NEXT_PUBLIC_`
- `SUPABASE_SERVICE_ROLE_KEY` — used only in admin routes (webhook), bypasses RLS intentionally
- Row Level Security enabled on all user-related tables (`profiles`: SELECT/INSERT/UPDATE own row; `orders`: SELECT/INSERT own rows only — **no user `UPDATE` on `orders`**; `payment_ref` / `status` are written from **authenticated API routes** using the service-role client with `id` + `user_id` filters)
- Route protection via `proxy.ts` (Next.js middleware) — unauthenticated users are redirected
- No raw SQL queries — all database access through Supabase type-safe client
- **Payment route bodies** validated with **Yup** (`/api/payment/*`) before business logic

---

## 💡 Assumptions & Design Decisions

1. **StarPay API Integration**: Implemented according to the official StarPay OpenAPI specification (`/trdp/order`, `/trdp/verify`, and webhook signature verification).
2. **Cart clearing**: Cart is cleared only after payment is confirmed (verified success redirect), not before redirecting to StarPay.
3. **Free delivery**: Simplified to free delivery for all orders; a real system would calculate based on address.
4. **Auth flows out of scope**: **Password reset** and **email verification** flows are intentionally **not** implemented (no UI or API routes). For local testing, configure Supabase Auth (e.g. disable email confirmation) in the project dashboard as needed.
5. **Product images**: Assumed externally hosted URLs (e.g., Unsplash, Supabase Storage) stored in `image_url`.
6. **StarPay phone**: Server always sends `+251900000000` to StarPay per challenge instructions, regardless of the phone entered in checkout.
7. **StarPay credentials required**: Checkout fails with a clear error if `STARPAY_API_KEY` or `STARPAY_BASE_URL` is not configured.
8. **Client-only cart (no server cart sync)**: Cart is not stored in Postgres per user. Instead, **Supabase is queried for current product price and stock** when the cart shell loads, and line items are updated in Zustand (`hydrateProductSnapshots`) so checkout totals stay honest without a full “server cart” feature.
9. **Error boundaries**: `app/error.tsx` handles recoverable route errors; `app/global-error.tsx` handles root layout failures.
10. **Touch Hover Zoom Detection**: Disabling pointer hover zoom on mobile/tablet screens is implemented via client-side pointer-feature checking (`window.matchMedia('(hover: hover)')`). Rather than using simple client-width media queries which are highly inaccurate, this accurately detects genuine touch-only interfaces.

---

## ⚖️ Tradeoffs Considered

| Decision | Alternative | Why Chosen |
|---|---|---|
| App Router over Pages Router | Pages Router | App Router enables Server Components for better performance and is the modern Next.js standard |
| Sonner over react-hot-toast | react-hot-toast | Better TypeScript support, richer action support, more customizable |
| CVA for button variants | Inline conditionals | CVA makes variant logic readable, type-safe, and extensible |
| Feature-based folder structure | Type-based (components/, pages/, utils/) | Scales better; related files live together |
| Universal Yup for Validation | Zod for API routes | Challenge mandated Formik + Yup for client forms, so we chose to use Yup universally across client & server to avoid fragmented dependencies. |
| No password reset / email verification UI | Full auth suite | Out of scope for this challenge; Supabase dashboard covers testing needs |
| Client cart + catalog reconciliation | Server-persisted cart | Keeps scope smaller while still avoiding stale checkout prices |
| Orders RLS without user `UPDATE` | Users update orders directly | Payment `payment_ref` / `status` are written only from authenticated Next.js routes using the **service role** with `id` + `user_id` filters — avoids clients spoofing paid status |
| JS Order Stats Aggregation | SQL `GROUP BY` / RPC | Order stats are currently aggregated in JS by fetching all rows — a Supabase RPC with a SQL `GROUP BY` would be more efficient at scale to avoid O(N) memory/bandwidth. |

---

## 🧪 Testing Payment

Use the test phone number: **`0900000000`**

> ⚠️ Using real phone numbers may result in real money deduction from real accounts.

---

## 📦 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all environment variables in the Vercel project dashboard under **Settings → Environment Variables**.

---

*ShopLinker — Frontend Technical Challenge submission*
