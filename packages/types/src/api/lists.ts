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

export interface UpdateListRequest {
  name: string;
}

export interface UpdateListResponseDto {
  list: ListDto;
}

export interface ToggleBacklogResponseDto {
  list: ListDto;
}

export interface ReorderListRequest {
  newOrderIndex?: number;
  afterListId?: string;
}

export interface ReorderListResponseDto {
  list: ListDto;
}
