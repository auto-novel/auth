import { isHTTPError } from 'ky';

import type { AccessTokenProvider } from './client';
import { isKnownRole } from './role';
import type { AuthUser } from './user';

interface AccessTokenProfile extends Omit<AuthUser, 'adminMode'> {
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
  autoStart?: boolean;
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
  const listeners = new Set<(user?: AuthUser) => void>();
  let profile: AccessTokenProfile | undefined;
  let adminMode = false;
  let initialized = false;
  let refreshRequest: Promise<string | undefined> | undefined;
  let sessionVersion = 0;
  let started = false;
  let disposed = false;
  let refreshTimer: ReturnType<typeof globalThis.setInterval> | undefined;
  let eventTarget: Window | undefined;
  let storageListenerAttached = false;

  function assertNotDisposed() {
    if (disposed) throw new Error('Auth session has been disposed');
  }

  function assertActive() {
    assertNotDisposed();
    if (!started) {
      throw new Error('Auth session has not started; call start() first');
    }
  }

  function notify(listener: (user?: AuthUser) => void) {
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

  function setAdminMode(enabled: boolean): boolean {
    assertActive();
    const nextMode = enabled === true && profile?.role === 'admin';
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

  function subscribe(listener: (user?: AuthUser) => void) {
    assertNotDisposed();
    listeners.add(listener);
    notify(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function onStorage(event: StorageEvent) {
    if (
      !started ||
      disposed ||
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
        if (version !== sessionVersion)
          return disposed ? undefined : profile?.token;
        setAccessToken(token);
        if (version !== sessionVersion)
          return disposed ? undefined : profile?.token;
        initialized = true;
        return token;
      } catch (error) {
        if (version !== sessionVersion)
          return disposed ? undefined : profile?.token;
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

  function dispose() {
    if (disposed) return;
    disposed = true;
    sessionVersion++;
    refreshRequest = undefined;
    listeners.clear();
    profile = undefined;
    adminMode = false;
    initialized = false;
    try {
      if (refreshTimer !== undefined) {
        const timer = refreshTimer;
        refreshTimer = undefined;
        globalThis.clearInterval(timer);
      }
    } finally {
      if (storageListenerAttached) {
        storageListenerAttached = false;
        eventTarget?.removeEventListener('storage', onStorage);
      }
      eventTarget = undefined;
    }
  }

  function start() {
    assertNotDisposed();
    if (started) return;
    started = true;
    try {
      const storedSession = storage?.get();
      profile = storedSession?.profile;
      adminMode = storedSession?.adminMode ?? false;
      initialized = profile !== undefined;
      for (const listener of listeners) notify(listener);
      assertActive();

      eventTarget =
        storage &&
        typeof window !== 'undefined' &&
        typeof window.addEventListener === 'function'
          ? window
          : undefined;
      if (eventTarget) {
        // Mark first so cleanup also handles an attachment that throws.
        storageListenerAttached = true;
        eventTarget.addEventListener('storage', onStorage);
      }

      // Preserve the eager API's initial-check-before-interval timing.
      void checkSignedIn().catch(() => undefined);
      assertActive();
      refreshTimer = globalThis.setInterval(() => {
        if (
          !disposed &&
          profile &&
          Date.now() - profile.issuedAt * 1000 >= ACCESS_TOKEN_REFRESH_AGE
        ) {
          void refreshAccessToken().catch(() => undefined);
        }
      }, ACCESS_TOKEN_REFRESH_INTERVAL);
    } catch (error) {
      try {
        dispose();
      } catch {
        // Preserve the original startup error after attempting all cleanup.
      }
      throw error;
    }
  }

  if (options.autoStart !== false) start();

  return {
    accessToken,
    checkSignedIn,
    setAdminMode,
    toggleAdminMode() {
      return setAdminMode(!adminMode);
    },
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
    dispose,
    subscribe,
  };
}
