export interface GetDoneQuery {
  limit?: number;
  offset?: number;
}

export interface DoneTaskDto {
  id: string;
  title: string;
  description: string | null;
  completedAt: Date;
  listId: string;
  listName: string;
  color: string;
  originBacklogId: string;
}

export interface GetDoneResponseDto {
  tasks: DoneTaskDto[];
  total: number;
  limit: number;
  offset: number;
}
