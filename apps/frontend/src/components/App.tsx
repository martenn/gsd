import { QueryProvider } from '../providers/QueryProvider';
import { AppShell } from './app-shell/AppShell';
import { PlanView } from './views/PlanView';
import { WorkView } from './views/WorkView';
import { DoneView } from './views/DoneView';

interface AppProps {
  currentPath: string;
}

export function App({ currentPath }: AppProps) {
  const getView = () => {
    if (currentPath.includes('/work')) return <WorkView />;
    if (currentPath.includes('/done')) return <DoneView />;
    return <PlanView />;
  };

  return (
    <QueryProvider>
      <AppShell>{getView()}</AppShell>
    </QueryProvider>
  );
}
