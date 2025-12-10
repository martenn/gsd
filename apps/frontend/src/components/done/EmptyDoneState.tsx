import { Button } from '../ui/button';

export function EmptyDoneState() {
  const handleGoToWorkMode = () => {
    window.location.href = '/app/work';
  };

  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      role="status"
      aria-label="No completed tasks"
    >
      <svg
        className="h-16 w-16 text-muted-foreground mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <h2 className="text-xl font-semibold text-foreground mb-2">No completed tasks yet</h2>

      <p className="text-muted-foreground mb-6 max-w-sm">
        Start completing tasks in Work Mode to see them here.
      </p>

      <Button onClick={handleGoToWorkMode}>Go to Work Mode</Button>
    </div>
  );
}
