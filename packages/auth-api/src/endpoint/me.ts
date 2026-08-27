import type { ApiClient } from './client';
import type { CreatedRangeParams, Page, PaginationParams } from './types';

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
      return client
        .get('me/strikes', {
          searchParams: {
            page: params.page,
            page_size: params.pageSize,
            created_after: params.createdAfter,
            created_before: params.createdBefore,
          },
        })
        .json<Page<MyStrike>>();
    },
  };
}
