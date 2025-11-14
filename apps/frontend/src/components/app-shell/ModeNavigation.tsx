import type { ModeNavigationProps, Mode } from '../../types/app-shell';
import { ModeButton } from './ModeButton';

const MODES: Mode[] = ['plan', 'work', 'done'];

export function ModeNavigation({
  currentMode,
  onModeChange,
}: ModeNavigationProps) {
  return (
    <nav className="flex gap-2">
      {MODES.map((mode) => (
        <ModeButton
          key={mode}
          mode={mode}
          isActive={currentMode === mode}
          onClick={() => onModeChange(mode)}
        />
      ))}
    </nav>
  );
}
