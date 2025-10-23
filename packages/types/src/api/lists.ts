export interface ListDto {
  id: string;
  name: string;
  orderIndex: number;
  isBacklog: boolean;
  isDone: boolean;
  color: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetListsResponseDto {
  lists: ListDto[];
}

export interface CreateListRequest {
  name: string;
  isBacklog?: boolean;
  color?: string;
}
