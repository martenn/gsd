import { useEffect, useState } from 'react';
import type { AppShellProps, Mode } from '../../types/app-shell';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalKeyboardShortcut } from '../../hooks/useGlobalKeyboardShortcut';
import { AppHeader } from './AppHeader';
import { DumpModeModal } from '../modals/DumpModeModal';
import { ErrorBoundary } from '../errors/ErrorBoundary';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function AppShell({ children }: AppShellProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isDumpModeOpen, setIsDumpModeOpen] = useState(false);

  useGlobalKeyboardShortcut('d', { cmd: true, shift: true }, () => {
    setIsDumpModeOpen(true);
  });

  useEffect(() => {
    console.log('AppShell auth state:', { isLoading, isAuthenticated, user });
    if (!isLoading && !isAuthenticated) {
      console.log('Not authenticated, redirecting to /');
      window.location.href = '/';
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner variant="spinner" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getCurrentMode = (): Mode => {
    const path = window.location.pathname;
    if (path.includes('/work')) return 'work';
    if (path.includes('/done')) return 'done';
    return 'plan';
  };

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col">
        <AppHeader currentMode={getCurrentMode()} user={user} onLogout={logout} />
        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
        <DumpModeModal isOpen={isDumpModeOpen} onOpenChange={setIsDumpModeOpen} />
      </div>
    </ErrorBoundary>
  );
}
