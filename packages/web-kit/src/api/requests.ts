import type { KyInstance } from 'ky';
import { createAuthAwareApiClientInner, type AccessTokenProvider } from './client';

export interface BanUserRequest {
  username: string;
  reason: string;
}

export interface CreateStrikeResponse {
  id: number;
  username: string | null;
  operatorUsername?: string;
  reason: string;
  evidence: string;
  point: number;
  createdAt: string;
  revokedAt?: string;
  revokedByUsername?: string;
  attr: Record<string, unknown>;
}

export interface CreateStrikeRequest {
  username: string;
  reason: string;
  evidence: string;
  point: number;
}

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
  latestStrikeId: number;
}

export interface MyStrikeListParams {
  page: number;
  pageSize: number;
  createdAfter?: number;
  createdBefore?: number;
}

export interface StrikeReadState {
  hasUnread: boolean;
}

export interface AttentionStatus {
  strikes: StrikeReadState;
}

export function createAuthApi(
  authClient: KyInstance,
  provider: AccessTokenProvider,
) {
  const client = createAuthAwareApiClientInner(authClient, provider);
  return {
    banUser(request: BanUserRequest) {
      return client.post('admin/user/ban', { json: request }).text();
    },
    createStrike(request: CreateStrikeRequest) {
      return client
        .post('admin/strikes', { json: request })
        .json<CreateStrikeResponse>();
    },
    getMyStrikes(params: MyStrikeListParams) {
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
    getAttentionStatus() {
      return client.get('me/attention-status').json<AttentionStatus>();
    },
    updateMyStrikeReadState(throughId: number) {
      return client
        .put('me/strikes/read-state', { json: { throughId } })
        .json<StrikeReadState>();
    },
  };
}
