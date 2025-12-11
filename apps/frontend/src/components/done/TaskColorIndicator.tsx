interface TaskColorIndicatorProps {
  color: string;
  className?: string;
}

export function TaskColorIndicator({ color, className = '' }: TaskColorIndicatorProps) {
  return (
    <div
      className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}
