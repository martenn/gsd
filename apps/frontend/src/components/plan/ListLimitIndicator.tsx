interface ListLimitIndicatorProps {
  count: number;
  max: number;
}

export function ListLimitIndicator({ count, max }: ListLimitIndicatorProps) {
  const percentage = (count / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = count >= max;

  const colorClass = isAtLimit
    ? 'bg-destructive/10 text-destructive'
    : isNearLimit
      ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500'
      : 'bg-muted text-muted-foreground';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ${colorClass}`}
      title={
        isAtLimit
          ? 'List is full (max 100 tasks)'
          : isNearLimit
            ? 'List is near capacity'
            : `${count} of ${max} tasks`
      }
    >
      {count}/{max}
    </span>
  );
}
