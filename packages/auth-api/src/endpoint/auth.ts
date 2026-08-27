import type { ApiClient } from './client';

export function createAuthEndpoints(client: ApiClient) {
  return {
    refresh(app: string) {
      return client
        .post('auth/refresh', undefined, {
          credentials: 'include',
          searchParams: { app },
        })
        .text();
    },
    logout() {
      return client
        .post('auth/logout', undefined, {
          credentials: 'include',
        })
        .void();
    },
  };
}
