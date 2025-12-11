import { useState, useEffect } from 'react';

export function useTimezoneDetection() {
  const [timezone, setTimezone] = useState<string>('UTC');

  useEffect(() => {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(detectedTimezone);
    } catch (error) {
      console.error('Failed to detect timezone, using UTC:', error);
      setTimezone('UTC');
    }
  }, []);

  return timezone;
}
