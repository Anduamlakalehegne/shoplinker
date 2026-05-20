import { cn } from '@/lib/utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary/15 text-primary border-primary/30',
  success: 'bg-primary/15 text-primary border-primary/30',
  warning:
    'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:bg-amber-400/15 dark:text-amber-400 dark:border-amber-400/30',
  danger: 'bg-destructive/15 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40 dark:text-red-400',
  info: 'bg-blue-500/15 text-blue-800 border-blue-500/30 dark:text-blue-400',
  outline: 'bg-transparent text-muted-foreground border-border',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
