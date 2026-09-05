import type { ApiClient } from './client';

export function createAuthEndpoints(client: ApiClient) {
  return {
    refresh(app: string) {
      return client
        .post('auth/refresh', {
          credentials: 'include',
          searchParams: { app },
        })
        .text();
    },
    logout() {
      return client.post('auth/logout', { credentials: 'include' }).text();
    },
  };
}
