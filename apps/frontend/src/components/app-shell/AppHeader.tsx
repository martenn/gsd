import type { AppHeaderProps } from '../../types/app-shell';
import { Logo } from './Logo';
import { ModeNavigation } from './ModeNavigation';
import { UserMenu } from './UserMenu';

export function AppHeader({ currentMode, user, onLogout }: AppHeaderProps) {
  const handleModeChange = (mode: string) => {
    window.location.href = `/app/${mode}`;
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <Logo />
        <ModeNavigation currentMode={currentMode} onModeChange={handleModeChange} />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
