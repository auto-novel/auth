import {
  createAdminEndpoints,
  createAuthEndpoints,
  createMeEndpoints,
} from './endpoint';
import { createApiClient } from './endpoint/client';
import { createAuthSession, type AuthUser } from './session';

export interface AuthApiOptions {
  fetch?: typeof globalThis.fetch;
  app: string;
  baseUrl: string;
  storage?: {
    key: string;
    target: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  };
}

export function createAuthApi(options: AuthApiOptions) {
  const requestOptions = {
    baseUrl: options.baseUrl,
    fetch: options.fetch,
  };
  const authClient = createApiClient(requestOptions);
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
    dispose: session.dispose,
    subscribeUser(listener: (user?: AuthUser) => void) {
      return session.subscribe(listener);
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
