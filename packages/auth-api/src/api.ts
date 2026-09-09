import { createApiClient, createAuthAwareApiClient } from './client';
import { createAuthSession } from './session';

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
}

export interface MyStrikeListParams {
  page: number;
  pageSize: number;
  createdAfter?: number;
  createdBefore?: number;
}

export interface AuthApiOptions {
  app: string;
  baseUrl: string;
  storage?: {
    key: string;
    target: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  };
}

export function createAuthApi(options: AuthApiOptions) {
  const authClient = createApiClient(options.baseUrl);
  const session = createAuthSession({
    app: options.app,
    storage: options.storage,
    requestLogout: () =>
      authClient.post('auth/logout', { credentials: 'include' }).text(),
    requestRefresh: (app) =>
      authClient
        .post('auth/refresh', {
          credentials: 'include',
          searchParams: { app },
        })
        .text(),
  });

  function createClient(baseUrl?: string) {
    return createAuthAwareApiClient(
      baseUrl === undefined ? authClient : createApiClient(baseUrl),
      session.accessToken,
    );
  }

  const client = createClient();

  return {
    createClient,
    checkSignedIn: session.checkSignedIn,
    refresh: session.accessToken.refresh,
    logout: session.logout,
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
    dispose: session.dispose,
    watchUser: session.subscribe,
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
