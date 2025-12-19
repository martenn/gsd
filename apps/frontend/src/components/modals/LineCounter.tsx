import { cn } from '@/lib/utils';

interface LineCounterProps {
  currentCount: number;
  maxCount: number;
}

export function LineCounter({ currentCount, maxCount }: LineCounterProps) {
  const getColorClass = () => {
    if (currentCount > maxCount) return 'text-destructive';
    if (currentCount >= maxCount - 1) return 'text-yellow-600 dark:text-yellow-500';
    if (currentCount >= maxCount - 2) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-muted-foreground';
  };

  return (
    <span className={cn('text-xs font-medium', getColorClass())}>
      {currentCount}/{maxCount} lines
    </span>
  );
}
