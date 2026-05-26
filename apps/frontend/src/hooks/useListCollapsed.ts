import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = (listId: string) => `gsd:listCollapsed:${listId}`;

export function useListCollapsed(listId: string): [boolean, () => void] {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY(listId)) === '1';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isCollapsed) {
      window.localStorage.setItem(STORAGE_KEY(listId), '1');
    } else {
      window.localStorage.removeItem(STORAGE_KEY(listId));
    }
  }, [listId, isCollapsed]);

  const toggle = useCallback(() => setIsCollapsed((prev) => !prev), []);

  return [isCollapsed, toggle];
}
