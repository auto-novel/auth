import {
  createAdminEndpoints,
  createAuthEndpoints,
  createMeEndpoints,
} from './endpoint';
import {
  createApiClient,
  createAuthenticatedApiClient,
} from './endpoint/client';
import { createAuthSession, type AuthUser } from './session';

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
  const authEndpoints = createAuthEndpoints(authClient);
  const session = createAuthSession({
    app: options.app,
    storage: options.storage,
    requestLogout: () => authEndpoints.logout(),
    requestRefresh: (app) => authEndpoints.refresh(app),
  });
  const client = createAuthenticatedApiClient(authClient, session.accessToken);

  return {
    client,
    auth: {
      refresh: session.accessToken.refresh,
      logout: session.logout,
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
