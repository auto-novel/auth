import { createAdminEndpoints } from './admin';
import {
  createAuthEndpoints,
  parseAccessToken,
  type UserProfile,
} from './auth';
import {
  ApiError,
  createApiClient,
  type AccessTokenSession,
  type ApiRequestOptions,
} from './client';
import { createMeEndpoints } from './me';

export interface CreateAuthApiOptions extends ApiRequestOptions {
  app?: string;
  authBaseUrl?: string;
  storage?: {
    key: string;
    target: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  };
}

const ACCESS_TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000;
const ACCESS_TOKEN_REFRESH_AGE = 60 * 60 * 1000;

function createAuthStorage(options?: CreateAuthApiOptions['storage']) {
  function clear() {
    if (!options) return;
    try {
      options.target.removeItem(options.key);
    } catch {
      // Storage may be unavailable or blocked by the browser.
    }
  }

  function getUserProfile() {
    if (!options) return;

    try {
      const stored = options.target.getItem(options.key);
      if (!stored) return;

      const storedProfile = JSON.parse(stored) as { token?: unknown };
      if (typeof storedProfile.token !== 'string') {
        throw new Error('存储的访问令牌无效');
      }

      const profile = parseAccessToken(storedProfile.token);
      if (Date.now() >= profile.expiredAt * 1000) {
        clear();
        return;
      }

      return profile;
    } catch {
      clear();
      return;
    }
  }

  function setUserProfile(profile: UserProfile) {
    if (!options) return;
    try {
      options.target.setItem(options.key, JSON.stringify(profile));
    } catch {
      // A successful refresh remains usable even if persistence fails.
    }
  }

  return { getUserProfile, setUserProfile, clear };
}

function startAccessTokenRefresh(
  getUserProfile: () => UserProfile | undefined,
  refreshAccessToken: () => Promise<string>,
) {
  return globalThis.setInterval(() => {
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

  const session: AccessTokenSession = {
    getAccessToken: () => profile?.token,
    refreshAccessToken,
  };
  const client = createApiClient({ ...requestOptions, session });
  const refreshTimer = options.app
    ? startAccessTokenRefresh(() => profile, refreshAccessToken)
    : undefined;

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
    dispose() {
      if (refreshTimer !== undefined) globalThis.clearInterval(refreshTimer);
      listeners.clear();
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
