import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { DumpModeForm } from './DumpModeForm';

interface DumpModeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DumpModeModal({ isOpen, onOpenChange }: DumpModeModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quick Add Tasks</DialogTitle>
        </DialogHeader>
        <DumpModeForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}
