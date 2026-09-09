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
  url: string;
  storage?: {
    key: string;
    target: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  };
}

export function createAuthApi(options: AuthApiOptions) {
  const authUrl = new URL(options.url);
  const authClient = createApiClient(new URL('api/v1/', authUrl).toString());
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

  const client = createAuthAwareApiClient(authClient, session.accessToken);

  return {
    createClient(baseUrl: string) {
      return createAuthAwareApiClient(
        createApiClient(baseUrl),
        session.accessToken,
      );
    },
    createLoginUrl(theme: 'dark' | 'light') {
      const url = new URL(authUrl);
      url.searchParams.set('app', options.app);
      url.searchParams.set('theme', theme);
      return url.toString();
    },
    /** Returns undefined for unrelated messages, or a login completion promise. */
    handleLoginMessage(
      event: MessageEvent<unknown>,
      source: Window | null | undefined,
    ): Promise<void> | undefined {
      if (
        !source ||
        event.origin !== authUrl.origin ||
        event.source !== source ||
        typeof event.data !== 'object' ||
        event.data === null ||
        !('type' in event.data) ||
        event.data.type !== 'login_success'
      ) {
        return;
      }

      return session.accessToken.refresh().then((token) => {
        if (!token) throw new Error('登录状态同步失败，请重试');
      });
    },
    checkSignedIn: session.checkSignedIn,
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
