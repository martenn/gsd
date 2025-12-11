import { CheckCircle2 } from 'lucide-react';

export function EmptyWorkState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
      <CheckCircle2 className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold text-foreground mb-2">All caught up!</h2>
      <p className="text-muted-foreground max-w-md">
        Your active work list is empty. Head to Plan mode to add tasks or move tasks from your
        backlogs.
      </p>
    </div>
  );
}
