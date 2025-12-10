import { useRelativeTime } from '../../hooks/useRelativeTime';

interface CompletionTimestampProps {
  completedAt: Date;
  timezone: string;
}

export function CompletionTimestamp({ completedAt, timezone }: CompletionTimestampProps) {
  const { relative, absolute, useRelative } = useRelativeTime(completedAt, timezone);

  return (
    <time
      dateTime={completedAt.toISOString()}
      title={absolute}
      className="text-xs text-muted-foreground"
    >
      Completed {useRelative ? relative : absolute}
    </time>
  );
}
