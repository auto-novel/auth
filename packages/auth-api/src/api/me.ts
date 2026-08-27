import type { ApiClient } from '../client';
import { createPagination, setCreatedRange } from './query';
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
      const searchParams = createPagination(params);
      setCreatedRange(searchParams, params);
      return client.get(`me/strikes?${searchParams}`).json<Page<MyStrike>>();
    },
  };
}
