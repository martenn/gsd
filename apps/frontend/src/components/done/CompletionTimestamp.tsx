interface CompletionTimestampProps {
  completedAt: Date;
  timezone: string;
}

function formatCompletedAt(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

export function CompletionTimestamp({ completedAt, timezone }: CompletionTimestampProps) {
  return (
    <time
      dateTime={completedAt.toISOString()}
      className="shrink-0 text-xs tabular-nums text-muted-foreground"
    >
      {formatCompletedAt(completedAt, timezone)}
    </time>
  );
}
