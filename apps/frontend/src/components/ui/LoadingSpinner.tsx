import { Skeleton } from './skeleton';

interface LoadingSpinnerProps {
  variant?: 'spinner' | 'skeleton-list' | 'skeleton-card' | 'skeleton-tasks';
  count?: number;
}

export function LoadingSpinner({ variant = 'spinner', count = 3 }: LoadingSpinnerProps) {
  if (variant === 'spinner') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (variant === 'skeleton-list') {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'skeleton-card') {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'skeleton-tasks') {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md border p-3">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
