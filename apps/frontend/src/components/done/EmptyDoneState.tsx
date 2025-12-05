export function EmptyDoneState() {
  const handleGoToWorkMode = () => {
    window.location.href = '/app/work';
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg
        className="h-16 w-16 text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">No completed tasks yet</h2>

      <p className="text-gray-600 mb-6 max-w-sm">
        Start completing tasks in Work Mode to see them here.
      </p>

      <button
        onClick={handleGoToWorkMode}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Work Mode
      </button>
    </div>
  );
}
