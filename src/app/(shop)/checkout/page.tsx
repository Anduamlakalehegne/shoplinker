'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFormik } from 'formik';
import { toast } from 'sonner';
import { ShoppingBag, MapPin, User } from 'lucide-react';
import { useCartStore, selectTotalPrice } from '@/store/useCartStore';
import { useCartHasHydrated } from '@/hooks/useCartHydration';
import { useAuthStore } from '@/store/useAuthStore';
import { useProfile } from '@/hooks/useProfile';
import { checkoutSchema } from '@/lib/validations/checkout.schema';
import { createOrder } from '@/services/order.service';
import { initiatePayment } from '@/services/payment.service';
import { redirectToExternalUrl } from '@/lib/utils/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils/money';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useProfile();
  const totalPrice = useCartStore(selectTotalPrice);
  const hasHydrated = useCartHasHydrated();

  const formik = useFormik({
    initialValues: {
      full_name: '',
      email: user?.email ?? '',
      phone: '',
      delivery_address: '',
      city: '',
      notes: '',
    },
    enableReinitialize: true,
    validationSchema: checkoutSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (items.length === 0) {
        toast.error('Your cart is empty');
        return;
      }

      try {
        const order = await createOrder({
          items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.price,
          })),
          total_amount: totalPrice,
          delivery_address: `${values.delivery_address}, ${values.city}`,
          phone: values.phone,
          order_notes: values.notes || undefined,
        });

        const nameParts = values.full_name.trim().split(' ');
        const { checkout_url } = await initiatePayment({
          orderId: order.id,
          amount: totalPrice,
          phone: values.phone,
          email: values.email,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || nameParts[0],
        });

        toast.success('Redirecting to payment...');
        redirectToExternalUrl(checkout_url);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const formikRef = useRef(formik);
  // Update the ref after every render (not during) to avoid the
  // "cannot update ref during render" lint rule violation.
  useLayoutEffect(() => {
    formikRef.current = formik;
  });

  const didPrefillFullName = useRef(false);
  useEffect(() => {
    if (!profile?.full_name || didPrefillFullName.current) return;
    if (formikRef.current.values.full_name.trim() !== '') return;
    didPrefillFullName.current = true;
    void formikRef.current.setFieldValue('full_name', profile.full_name, false);
  }, [profile?.full_name]);

  // Wait for the Zustand persist middleware to rehydrate from localStorage.
  // Without this guard, items is [] on first render causing a flash of the empty state
  // even when the user has items in their cart (e.g. returning from StarPay portal).
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
        <p className="text-muted-foreground">Add some products before checking out.</p>
        <Link href="/">
          <Button size="lg">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={formik.handleSubmit} className="space-y-6" noValidate>
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="full_name"
                    label="Full name"
                    placeholder="John Doe"
                    required
                    {...formik.getFieldProps('full_name')}
                    error={formik.touched.full_name ? formik.errors.full_name : undefined}
                  />
                  <Input
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    {...formik.getFieldProps('email')}
                    error={formik.touched.email ? formik.errors.email : undefined}
                  />
                </div>
                <div className="mt-4">
                  <Input
                    id="phone"
                    label="Phone number"
                    type="tel"
                    placeholder="0900000000"
                    required
                    helperText="Use 0900000000 for testing"
                    {...formik.getFieldProps('phone')}
                    error={formik.touched.phone ? formik.errors.phone : undefined}
                  />
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Delivery Address</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    id="delivery_address"
                    label="Street address"
                    placeholder="123 Main Street, Bole"
                    required
                    {...formik.getFieldProps('delivery_address')}
                    error={
                      formik.touched.delivery_address ? formik.errors.delivery_address : undefined
                    }
                  />
                  <Input
                    id="city"
                    label="City"
                    placeholder="Addis Ababa"
                    required
                    {...formik.getFieldProps('city')}
                    error={formik.touched.city ? formik.errors.city : undefined}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="notes" className="text-sm font-medium text-foreground">
                      Order notes <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <textarea
                      id="notes"
                      placeholder="Any special delivery instructions..."
                      rows={3}
                      {...formik.getFieldProps('notes')}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-background transition-all resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full" isLoading={formik.isSubmitting}>
              {formik.isSubmitting ? 'Processing...' : `Pay ${formatPrice(totalPrice)} with StarPay`}
            </Button>
          </form>
        </div>

        <div>
          <Card variant="elevated" className="sticky top-24">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white border border-border">
                      <Image
                        src={product.image_url.split(',')[0]}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground flex-shrink-0">
                      {formatPrice(product.price * quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="px-6 py-4 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Delivery</span>
                <span className="text-primary">Free</span>
              </div>
              <div className="flex items-center justify-between font-bold text-foreground text-lg border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary">{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
