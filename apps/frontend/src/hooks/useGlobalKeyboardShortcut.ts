import { useEffect } from 'react';

interface KeyboardShortcutModifiers {
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  ctrl?: boolean;
}

export function useGlobalKeyboardShortcut(
  key: string,
  modifiers: KeyboardShortcutModifiers,
  callback: () => void,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmdPressed = e.metaKey || e.ctrlKey;
      const isShiftPressed = e.shiftKey;
      const isAltPressed = e.altKey;
      const isCtrlPressed = e.ctrlKey;

      const modifiersMatch =
        (!modifiers.cmd || isCmdPressed) &&
        (!modifiers.shift || isShiftPressed) &&
        (!modifiers.alt || isAltPressed) &&
        (!modifiers.ctrl || isCtrlPressed);

      if (e.key.toLowerCase() === key.toLowerCase() && modifiersMatch) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, modifiers, callback]);
}
