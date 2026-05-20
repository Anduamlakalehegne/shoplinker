import Link from 'next/link';
import { SearchX, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/20">
        <div className="absolute inset-0 rounded-3xl bg-primary/5 animate-pulse" />
        <SearchX className="h-12 w-12 text-primary relative z-10" />
      </div>
      
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        Page not found
      </h1>
      
      <p className="mb-8 max-w-lg text-lg text-muted-foreground">
        Oops! The page you are looking for doesn&apos;t exist or has been moved.{' '}
        Let&apos;s get you back to our amazing products.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link href="/" className="w-full sm:w-auto">
          <Button size="lg" className="w-full gap-2 group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Shop
          </Button>
        </Link>
        <Link href="/" className="w-full sm:w-auto">
          <Button size="lg" variant="outline" className="w-full gap-2">
            <Home className="h-4 w-4" />
            Go to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
}
