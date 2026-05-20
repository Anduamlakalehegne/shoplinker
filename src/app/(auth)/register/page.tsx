'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { toast } from 'sonner';
import { User, Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { upsertUserProfile } from '@/services/profile.service';
import { registerSchema } from '@/lib/validations/auth.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

function RegisterForm() {
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { full_name: values.full_name },
          },
        });
        if (error) throw error;

        if (data.user) {
          await upsertUserProfile({
            id: data.user.id,
            full_name: values.full_name,
          });
        }

        toast.success('Account created! Welcome to ShopLinker.');
        router.push('/');
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Registration failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="mb-2 text-center flex flex-col items-center">
          <Image
            src="/loginlogo.png"
            alt="ShopLinker"
            width={150}
            height={150}
            className="object-contain mb-2"
            priority
          />
          <h1 className="text-3xl font-bold text-primary">Create your account</h1>
          <p className="mt-2 text-muted-foreground">Join ShopLinker today</p>
        </div>

        <Card variant="glass">
          <CardContent className="pt-6">
            <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
              <Input
                id="full_name"
                label="Full name"
                placeholder="John Doe"
                icon={<User className="h-4 w-4" />}
                required
                {...formik.getFieldProps('full_name')}
                error={formik.touched.full_name ? formik.errors.full_name : undefined}
              />
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
                placeholder="At least 6 characters"
                icon={<Lock className="h-4 w-4" />}
                required
                {...formik.getFieldProps('password')}
                error={formik.touched.password ? formik.errors.password : undefined}
              />
              <Input
                id="confirm_password"
                label="Confirm password"
                type="password"
                placeholder="Repeat your password"
                icon={<Lock className="h-4 w-4" />}
                required
                {...formik.getFieldProps('confirm_password')}
                error={formik.touched.confirm_password ? formik.errors.confirm_password : undefined}
              />
              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                isLoading={formik.isSubmitting}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-muted"></div>
            <div className="h-8 w-48 rounded bg-muted"></div>
            <div className="h-64 w-full max-w-md rounded-2xl bg-muted"></div>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
