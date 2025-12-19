import type { ListDto } from '@gsd/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface BacklogSelectorProps {
  backlogs: ListDto[];
  selectedBacklogId: string | null;
  onSelect: (backlogId: string) => void;
}

interface BacklogColorIndicatorProps {
  color: string;
}

function BacklogColorIndicator({ color }: BacklogColorIndicatorProps) {
  return <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />;
}

export function BacklogSelector({ backlogs, selectedBacklogId, onSelect }: BacklogSelectorProps) {
  const selectedBacklog = backlogs.find((b) => b.id === selectedBacklogId);

  return (
    <Select value={selectedBacklogId || undefined} onValueChange={onSelect}>
      <SelectTrigger className="w-full">
        <SelectValue>
          {selectedBacklog ? (
            <div className="flex items-center gap-2">
              {selectedBacklog.color && <BacklogColorIndicator color={selectedBacklog.color} />}
              <span>{selectedBacklog.name}</span>
            </div>
          ) : (
            'Select a backlog'
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {backlogs.map((backlog) => (
          <SelectItem key={backlog.id} value={backlog.id}>
            <div className="flex items-center gap-2">
              {backlog.color && <BacklogColorIndicator color={backlog.color} />}
              <span>{backlog.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
