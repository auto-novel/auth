import type { ApiClient } from './client';

export interface MyStrike {
  id: number;
  reason: string;
  evidence: string;
  point: number;
  createdAt: string;
  revokedAt?: string;
}

export interface MyStrikePage {
  total: number;
  items: MyStrike[];
}

export interface MyStrikeListParams {
  page: number;
  pageSize: number;
  createdAfter?: number;
  createdBefore?: number;
}

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
        .json<MyStrikePage>();
    },
  };
}
