import type { UserDto } from '@gsd/types';

export type Mode = 'plan' | 'work' | 'done';

export interface AppShellProps {
  children?: React.ReactNode;
}

export interface AppHeaderProps {
  currentMode: Mode;
  user: UserDto;
  onLogout: () => void;
}

export interface ModeNavigationProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export interface ModeButtonProps {
  mode: Mode;
  isActive: boolean;
  onClick: () => void;
}

export interface UserMenuProps {
  user: UserDto;
  onLogout: () => void;
}
