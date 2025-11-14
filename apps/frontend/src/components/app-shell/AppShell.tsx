import { useEffect } from 'react';
import type { AppShellProps, Mode } from '../../types/app-shell';
import { useAuth } from '../../hooks/useAuth';
import { AppHeader } from './AppHeader';

export function AppShell({ children }: AppShellProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

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
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
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
    <div className="h-screen flex flex-col">
      <AppHeader currentMode={getCurrentMode()} user={user} onLogout={logout} />
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}
