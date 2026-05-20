import { cn } from '@/lib/utils/cn';

interface StarRatingProps {
  /** Rating value between 0 and 5. Pass null to render nothing. */
  rating: number | null;
  /** Number of ratings. Displayed in parentheses when provided. */
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Renders a 5-star row with filled / half / empty SVG stars driven by
 * the `rating` prop. Avoids the Star icon from Lucide because we need
 * half-star fidelity via SVG clipPath.
 */
export function StarRating({ rating, count, size = 'sm', className }: StarRatingProps) {
  if (rating === null || rating === undefined) return null;

  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const half = !filled && rating >= star - 0.5;

          return (
            <svg
              key={star}
              className={starSize}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id={`half-${star}`}>
                  <rect x="0" y="0" width="12" height="24" />
                </clipPath>
              </defs>

              {/* Background (empty) star */}
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="currentColor"
                className="text-muted/60"
              />

              {/* Filled overlay */}
              {(filled || half) && (
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="currentColor"
                  className="text-amber-400"
                  clipPath={half ? `url(#half-${star})` : undefined}
                />
              )}
            </svg>
          );
        })}
      </div>

      <span className="text-xs font-semibold text-foreground" aria-label={`Rating: ${rating} out of 5`}>
        {rating.toFixed(1)}
      </span>

      {count !== undefined && count > 0 && (
        <span className="text-xs text-muted-foreground">
          ({count > 999 ? `${(count / 1000).toFixed(1)}k` : count})
        </span>
      )}
    </div>
  );
}
