import { Check } from 'lucide-react';
import { Button } from '../ui/button';

interface CompleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function CompleteButton({ onClick, disabled }: CompleteButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="lg"
      className="w-full md:w-auto px-8 py-6 text-lg font-semibold"
    >
      <Check className="w-5 h-5 mr-2" />
      Complete Task
    </Button>
  );
}
