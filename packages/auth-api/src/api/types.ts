export interface Page<T> {
  total: number;
  items: T[];
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface CreatedRangeParams {
  createdAfter?: number;
  createdBefore?: number;
}
