import {
  requestJson,
  type AccessTokenSession,
  type ApiRequestOptions,
} from './client';
import type { CreatedRangeParams, Page, PaginationParams } from './admin';

export interface MyStrike {
  id: number;
  reason: string;
  evidence: string;
  point: number;
  createdAt: string;
  revokedAt?: string;
}

export interface MyStrikeListParams
  extends PaginationParams, CreatedRangeParams {}

export function getMyStrikes(
  session: AccessTokenSession,
  params: MyStrikeListParams,
  options: ApiRequestOptions,
) {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.createdAfter !== undefined) {
    searchParams.set('created_after', String(params.createdAfter));
  }
  if (params.createdBefore !== undefined) {
    searchParams.set('created_before', String(params.createdBefore));
  }
  return requestJson<Page<MyStrike>>(`me/strikes?${searchParams}`, {
    ...options,
    session,
  });
}
