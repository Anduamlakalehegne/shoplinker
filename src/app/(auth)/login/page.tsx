'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik } from 'formik';
import { toast } from 'sonner';
import { Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/validations/auth.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        toast.success('Welcome back!');
        router.push(redirectTo);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-12">
      {/* Decorative background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Header */}
        <div className="mb-2 text-center flex flex-col items-center">
          <Image
            src="/loginlogo.png"
            alt="ShopLinker"
            width={150}
            height={150}
            className="object-contain mb-2"
            priority
          />
          <h1 className="text-3xl font-bold text-primary">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your ShopLinker account</p>
        </div>

        <Card variant="glass">
          <CardContent className="pt-6">
            <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
              <Input
                id="email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="h-4 w-4" />}
                required
                {...formik.getFieldProps('email')}
                error={formik.touched.email ? formik.errors.email : undefined}
              />
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                required
                {...formik.getFieldProps('password')}
                error={formik.touched.password ? formik.errors.password : undefined}
              />
              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                isLoading={formik.isSubmitting}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
                  Create one
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted"></div>
          <div className="h-8 w-48 rounded bg-muted"></div>
          <div className="h-64 w-full max-w-md rounded-2xl bg-muted"></div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
