interface MetricBadgeProps {
  label: string;
  count: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export function MetricBadge({ label, count, icon: Icon }: MetricBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-semibold text-foreground">{count}</span>
    </div>
  );
}
