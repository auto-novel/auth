import {
  createAdminEndpoints,
  createAuthEndpoints,
  createMeEndpoints,
} from './endpoint';
import { createApiClient } from './endpoint/client';
import { createAuthSession, type UserProfile } from './session';

export interface AuthApiOptions {
  timeout?: number;
  fetch?: typeof globalThis.fetch;
  app?: string;
  baseUrl: string;
  storage?: {
    key: string;
    target: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  };
}

export function createAuthApi(options: AuthApiOptions) {
  const requestOptions = {
    baseUrl: options.baseUrl,
    timeout: options.timeout,
    fetch: options.fetch,
  };
  const authClient = createApiClient({
    ...requestOptions,
    timeout: options.timeout ?? 5000,
  });
  const authEndpoints = createAuthEndpoints(authClient);
  const session = createAuthSession({
    app: options.app,
    storage: options.storage,
    requestRefresh: (app) => authEndpoints.refresh(app),
  });
  const client = createApiClient({
    ...requestOptions,
    accessToken: session.accessToken,
  });

  return {
    auth: {
      refresh: session.accessToken.refresh,
      logout() {
        session.clear();
        return authEndpoints.logout();
      },
    },
    admin: createAdminEndpoints(client),
    me: createMeEndpoints(client),
    subscribeUserProfile(listener: (profile?: UserProfile) => void) {
      return session.subscribe(listener);
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
