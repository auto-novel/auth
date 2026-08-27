import {
  createAdminEndpoints,
  createAuthEndpoints,
  createMeEndpoints,
} from './endpoint';
import { createApiClient, type ApiRequestOptions } from './endpoint/client';
import {
  createAuthSession,
  type AuthStorageOptions,
  type UserProfile,
} from './session';

export interface CreateAuthApiOptions extends ApiRequestOptions {
  app?: string;
  authBaseUrl?: string;
  storage?: AuthStorageOptions;
}

export function createAuthApi(options: CreateAuthApiOptions) {
  const requestOptions = {
    baseUrl: options.baseUrl,
    timeout: options.timeout,
    fetch: options.fetch,
  };
  const authClient = createApiClient({
    ...requestOptions,
    baseUrl: options.authBaseUrl ?? options.baseUrl,
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
