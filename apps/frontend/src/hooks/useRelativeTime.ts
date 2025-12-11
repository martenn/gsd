import { useState, useEffect } from 'react';
import type { TimestampDisplay } from '../types/done';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
}

function formatAbsoluteTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(date);
}

export function useRelativeTime(completedAt: Date, timezone: string): TimestampDisplay {
  const [display, setDisplay] = useState<TimestampDisplay>(() => {
    const now = new Date();
    const diffMs = now.getTime() - completedAt.getTime();
    const useRelative = diffMs < SEVEN_DAYS_MS;

    return {
      relative: formatRelativeTime(completedAt),
      absolute: formatAbsoluteTime(completedAt, timezone),
      useRelative,
    };
  });

  useEffect(() => {
    const now = new Date();
    const diffMs = now.getTime() - completedAt.getTime();
    const useRelative = diffMs < SEVEN_DAYS_MS;

    if (useRelative) {
      const interval = setInterval(() => {
        setDisplay({
          relative: formatRelativeTime(completedAt),
          absolute: formatAbsoluteTime(completedAt, timezone),
          useRelative: true,
        });
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [completedAt, timezone]);

  return display;
}
