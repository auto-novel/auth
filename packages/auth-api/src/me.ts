import type { ApiClient } from './client';
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

export function createMeEndpoints(client: ApiClient) {
  return {
    getStrikes(params: MyStrikeListParams) {
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
      return client.get(`me/strikes?${searchParams}`).json<Page<MyStrike>>();
    },
  };
}
