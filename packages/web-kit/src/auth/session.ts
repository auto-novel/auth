import { isHTTPError } from 'ky';

import type { AccessTokenProvider } from './client';
import { isKnownRole } from './role';
import type { SessionUser } from './user';

interface AccessTokenProfile extends Omit<SessionUser, 'adminMode'> {
  token: string;
  issuedAt: number;
  expiredAt: number;
}

interface AccessTokenClaims {
  uid: number;
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
  app: string;
  storage?: AuthStorageOptions;
  requestLogout(): Promise<string>;
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
    !Number.isSafeInteger(claims.uid) ||
    claims.uid <= 0 ||
    !claims.sub ||
    !isKnownRole(claims.role) ||
    !Number.isFinite(claims.crat) ||
    !Number.isFinite(claims.iat) ||
    !Number.isFinite(claims.exp)
  ) {
    throw new Error('访问令牌内容无效');
  }

  return {
    token,
    id: claims.uid,
    username: claims.sub,
    role: claims.role,
    createdAt: claims.crat * 1000,
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

  function get(clearInvalid = true) {
    try {
      const stored = target.getItem(key);
      if (!stored) return;

      const storedSession = JSON.parse(stored) as {
        token?: unknown;
        adminMode?: unknown;
      };
      if (typeof storedSession.token !== 'string') {
        throw new Error('存储的访问令牌无效');
      }

      const profile = parseAccessToken(storedSession.token);
      if (Date.now() >= profile.expiredAt * 1000) {
        if (clearInvalid) clear();
        return;
      }

      return {
        profile,
        adminMode: profile.role === 'admin' && storedSession.adminMode === true,
      };
    } catch {
      if (clearInvalid) clear();
      return;
    }
  }

  function save(profile: AccessTokenProfile, adminMode: boolean) {
    try {
      target.setItem(key, JSON.stringify({ token: profile.token, adminMode }));
    } catch {
      // A successful refresh remains usable even if persistence fails.
    }
  }

  return { get, save, clear };
}

export function createAuthSession(options: AuthSessionOptions) {
  const storage = createAuthStorage(options.storage);
  const listeners = new Set<(user?: SessionUser) => void>();
  let profile: AccessTokenProfile | undefined;
  let adminMode = false;
  let initialized = false;
  let refreshRequest: Promise<string | undefined> | undefined;
  let sessionVersion = 0;
  let started = false;

  function assertActive() {
    if (!started) {
      throw new Error('Auth session has not started; call start() first');
    }
  }

  function notify(listener: (user?: SessionUser) => void) {
    try {
      listener(
        profile
          ? {
              id: profile.id,
              username: profile.username,
              role: profile.role,
              createdAt: profile.createdAt,
              adminMode,
            }
          : undefined,
      );
    } catch {
      // Subscribers must not change the result of token operations.
    }
  }

  function toggleAdminMode(): boolean {
    assertActive();
    const nextMode = !adminMode && profile?.role === 'admin';
    if (adminMode === nextMode) return adminMode;
    adminMode = nextMode;
    if (profile) storage?.save(profile, adminMode);
    for (const listener of listeners) notify(listener);
    return adminMode;
  }

  function setAccessToken(token?: string) {
    const previousUserId = profile?.id;
    profile = token ? parseAccessToken(token) : undefined;
    adminMode =
      profile?.role === 'admin' && profile.id === previousUserId && adminMode;
    if (profile) storage?.save(profile, adminMode);
    else storage?.clear();
    for (const listener of listeners) notify(listener);
  }

  function subscribe(listener: (user?: SessionUser) => void) {
    listeners.add(listener);
    notify(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function onStorage(event: StorageEvent) {
    if (
      !started ||
      !storage ||
      event.storageArea !== options.storage?.target ||
      (event.key !== null && event.key !== options.storage.key)
    ) {
      return;
    }

    // Read the current value rather than a potentially stale queued event.
    // Never write it back or let an older refresh overwrite the external session.
    sessionVersion++;
    refreshRequest = undefined;
    initialized = true;
    const storedSession = storage.get(false);
    profile = storedSession?.profile;
    adminMode = storedSession?.adminMode ?? false;
    for (const listener of listeners) notify(listener);
  }

  function refreshAccessToken(): Promise<string | undefined> {
    try {
      assertActive();
    } catch (error) {
      return Promise.reject(error);
    }
    if (refreshRequest) return refreshRequest;
    const app = options.app;
    const version = sessionVersion;

    const request = (async () => {
      try {
        const token = await options.requestRefresh(app);
        // A storage event may have replaced this refresh with a valid session.
        if (version !== sessionVersion) return profile?.token;
        setAccessToken(token);
        if (version !== sessionVersion) return profile?.token;
        initialized = true;
        return token;
      } catch (error) {
        if (version !== sessionVersion) return profile?.token;
        if (isHTTPError(error) && error.response.status === 401) {
          setAccessToken();
          if (version === sessionVersion) initialized = true;
          return;
        }
        throw error;
      } finally {
        if (version === sessionVersion) refreshRequest = undefined;
      }
    })();
    if (version === sessionVersion) refreshRequest = request;
    return request;
  }

  async function checkSignedIn() {
    assertActive();
    if (!initialized) {
      try {
        await refreshAccessToken();
      } catch {
        // A transient failure leaves the session uninitialized so the next
        // check can retry while preserving any locally available profile.
      }
    }
    assertActive();
    return profile !== undefined;
  }

  const accessToken = {
    get() {
      return profile?.token;
    },
    async ready() {
      await checkSignedIn();
    },
    refresh: refreshAccessToken,
  } satisfies AccessTokenProvider;

  function start() {
    if (started) return;
    started = true;
    const storedSession = storage?.get();
    profile = storedSession?.profile;
    adminMode = storedSession?.adminMode ?? false;
    initialized = profile !== undefined;
    for (const listener of listeners) notify(listener);

    if (
      storage &&
      typeof window !== 'undefined' &&
      typeof window.addEventListener === 'function'
    ) {
      window.addEventListener('storage', onStorage);
    }

    void checkSignedIn().catch(() => undefined);
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
    checkSignedIn,
    toggleAdminMode,
    async logout() {
      assertActive();
      // Ignore refreshes started before logout, including their errors.
      sessionVersion++;
      refreshRequest = undefined;
      initialized = true;
      setAccessToken();
      assertActive();
      return options.requestLogout();
    },
    start,
    subscribe,
  };
}
