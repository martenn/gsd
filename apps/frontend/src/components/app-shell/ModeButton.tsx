import type { ModeButtonProps } from '../../types/app-shell';

const MODE_LABELS = {
  plan: 'Plan',
  work: 'Work',
  done: 'Done',
};

export function ModeButton({ mode, isActive, onClick }: ModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2 text-sm font-medium rounded-md transition-colors
        ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
    >
      {MODE_LABELS[mode]}
    </button>
  );
}
