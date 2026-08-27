import { ApiError, type AccessTokenProvider } from './endpoint/client';

export interface AuthUser {
  username: string;
  role: string;
  createdAt: number;
}

interface AccessTokenProfile extends AuthUser {
  token: string;
  issuedAt: number;
  expiredAt: number;
}

interface AccessTokenClaims {
  sub: string;
  role: string;
  crat: number;
  iat: number;
  exp: number;
}

const ACCESS_TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000;
const ACCESS_TOKEN_REFRESH_AGE = 60 * 60 * 1000;

interface AuthStorageOptions {
  key: string;
  target: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

interface AuthSessionOptions {
  app?: string;
  storage?: AuthStorageOptions;
  requestRefresh(app: string): Promise<string>;
}

function parseAccessToken(token: string): AccessTokenProfile {
  const encodedPayload = token.split('.')[1];
  if (!encodedPayload) throw new Error('访问令牌格式无效');

  const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(paddedBase64), (character) =>
    character.charCodeAt(0),
  );
  const claims = JSON.parse(
    new TextDecoder().decode(bytes),
  ) as AccessTokenClaims;

  if (
    !claims.sub ||
    !claims.role ||
    !Number.isFinite(claims.crat) ||
    !Number.isFinite(claims.iat) ||
    !Number.isFinite(claims.exp)
  ) {
    throw new Error('访问令牌内容无效');
  }

  return {
    token,
    username: claims.sub,
    role: claims.role,
    createdAt: claims.crat,
    issuedAt: claims.iat,
    expiredAt: claims.exp,
  };
}

function createAuthStorage(options?: AuthStorageOptions) {
  if (!options) return;

  const { key, target } = options;

  function clear() {
    try {
      target.removeItem(key);
    } catch {
      // Storage may be unavailable or blocked by the browser.
    }
  }

  function get() {
    try {
      const stored = target.getItem(key);
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

  function save(profile: AccessTokenProfile) {
    try {
      target.setItem(key, JSON.stringify({ token: profile.token }));
    } catch {
      // A successful refresh remains usable even if persistence fails.
    }
  }

  return { get, save, clear };
}

export function createAuthSession(options: AuthSessionOptions) {
  const storage = createAuthStorage(options.storage);
  const listeners = new Set<(user?: AuthUser) => void>();
  let profile = storage?.get();
  let refreshRequest: Promise<string> | undefined;

  function notify(listener: (user?: AuthUser) => void) {
    try {
      listener(
        profile
          ? {
              username: profile.username,
              role: profile.role,
              createdAt: profile.createdAt,
            }
          : undefined,
      );
    } catch {
      // Subscribers must not change the result of token operations.
    }
  }

  function setAccessToken(token?: string) {
    profile = token ? parseAccessToken(token) : undefined;
    if (profile) storage?.save(profile);
    else storage?.clear();
    for (const listener of listeners) notify(listener);
  }

  function subscribe(listener: (user?: AuthUser) => void) {
    listeners.add(listener);
    notify(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function refreshAccessToken(): Promise<string> {
    if (refreshRequest) return refreshRequest;
    const app = options.app;
    if (!app) {
      return Promise.reject(new Error('刷新访问令牌前必须配置 app'));
    }

    const request = (async () => {
      try {
        const token = await options.requestRefresh(app);
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

  const accessToken = {
    get() {
      return profile?.token;
    },
    refresh: refreshAccessToken,
  } satisfies AccessTokenProvider;

  if (options.app) {
    globalThis.setInterval(() => {
      if (
        profile &&
        Date.now() - profile.issuedAt * 1000 >= ACCESS_TOKEN_REFRESH_AGE
      ) {
        void refreshAccessToken().catch(() => undefined);
      }
    }, ACCESS_TOKEN_REFRESH_INTERVAL);
  }

  return {
    accessToken,
    clear() {
      setAccessToken();
    },
    subscribe,
  };
}
