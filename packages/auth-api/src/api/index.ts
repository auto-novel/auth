import { createAdminEndpoints } from './admin';
import { createAuthEndpoints } from './auth';
import {
  ApiError,
  createApiClient,
  type AccessTokenProvider,
  type ApiRequestOptions,
} from '../client';
import {
  createAuthStorage,
  parseAccessToken,
  type AuthStorageOptions,
  type UserProfile,
} from '../session';
import { createMeEndpoints } from './me';

const ACCESS_TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000;
const ACCESS_TOKEN_REFRESH_AGE = 60 * 60 * 1000;

export interface CreateAuthApiOptions extends ApiRequestOptions {
  app?: string;
  authBaseUrl?: string;
  storage?: AuthStorageOptions;
}

function startAccessTokenRefresh(
  getUserProfile: () => UserProfile | undefined,
  refreshAccessToken: () => Promise<string>,
) {
  globalThis.setInterval(() => {
    const profile = getUserProfile();
    if (
      profile &&
      Date.now() - profile.issuedAt * 1000 >= ACCESS_TOKEN_REFRESH_AGE
    ) {
      void refreshAccessToken().catch(() => undefined);
    }
  }, ACCESS_TOKEN_REFRESH_INTERVAL);
}

export function createAuthApi(options: CreateAuthApiOptions) {
  const storage = createAuthStorage(options.storage);
  const listeners = new Set<(profile?: UserProfile) => void>();
  let profile = storage.getUserProfile();
  let refreshRequest: Promise<string> | undefined;
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

  function setAccessToken(token?: string) {
    const nextProfile = token ? parseAccessToken(token) : undefined;
    profile = nextProfile;
    if (nextProfile) storage.setUserProfile(nextProfile);
    else storage.clear();
    for (const listener of listeners) notifyListener(listener);
  }

  function notifyListener(listener: (profile?: UserProfile) => void) {
    try {
      listener(profile ? { ...profile } : undefined);
    } catch {
      // Subscribers must not change the result of token operations.
    }
  }

  function refreshAccessToken(): Promise<string> {
    if (refreshRequest) return refreshRequest;
    const app = options.app;
    if (!app) {
      return Promise.reject(new Error('刷新访问令牌前必须配置 app'));
    }

    const request = (async () => {
      try {
        const token = await authEndpoints.refresh(app);
        setAccessToken(token);
        return token;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setAccessToken();
        }
        throw error;
      } finally {
        refreshRequest = undefined;
      }
    })();
    refreshRequest = request;
    return request;
  }

  const accessToken: AccessTokenProvider = {
    get: () => profile?.token,
    refresh: refreshAccessToken,
  };
  const client = createApiClient({ ...requestOptions, accessToken });
  if (options.app) {
    startAccessTokenRefresh(() => profile, refreshAccessToken);
  }

  return {
    auth: {
      ...authEndpoints,
      refresh: refreshAccessToken,
      async logout() {
        setAccessToken();
        await authEndpoints.logout();
      },
    },
    admin: createAdminEndpoints(client),
    me: createMeEndpoints(client),
    subscribeUserProfile(listener: (profile?: UserProfile) => void) {
      listeners.add(listener);
      notifyListener(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
