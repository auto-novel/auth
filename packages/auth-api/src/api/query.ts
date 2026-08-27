import type { CreatedRangeParams, PaginationParams } from './types';

export function createPagination(params: PaginationParams) {
  return new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
}

export function setCreatedRange(
  searchParams: URLSearchParams,
  params: CreatedRangeParams,
) {
  if (params.createdAfter !== undefined) {
    searchParams.set('created_after', String(params.createdAfter));
  }
  if (params.createdBefore !== undefined) {
    searchParams.set('created_before', String(params.createdBefore));
  }
}
