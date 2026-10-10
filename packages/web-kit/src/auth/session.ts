import { isHTTPError } from 'ky';
import { watch } from 'vue';

import { createStoredRef } from '../storage';
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

interface StoredSession {
  profile: AccessTokenProfile;
  adminMode: boolean;
}

interface AuthSessionOptions {
  app: string;
  /** 会话持久化的键名；没有 storageArea 时只保留在内存里。 */
  storageKey: string;
  storageArea?: Storage;
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

export function createAuthSession(options: AuthSessionOptions) {
  const stored = createStoredRef<StoredSession | undefined>({
    key: options.storageKey,
    storage: options.storageArea,
    decode(raw) {
      try {
        const value = JSON.parse(raw) as {
          token?: unknown;
          adminMode?: unknown;
        };
        if (typeof value?.token !== 'string') return;

        const profile = parseAccessToken(value.token);
        // 过期令牌按无效值处理，由存储层删除。
        if (Date.now() >= profile.expiredAt * 1000) return;

        return {
          profile,
          adminMode: profile.role === 'admin' && value.adminMode === true,
        };
      } catch {
        return;
      }
    },
    encode(value) {
      return value
        ? JSON.stringify({
            token: value.profile.token,
            adminMode: value.adminMode,
          })
        : undefined;
    },
    fallback: () => undefined,
  });
  const restored = stored.value;
  const listeners = new Set<(user?: SessionUser) => void>();
  let profile = restored?.profile;
  let adminMode = restored?.adminMode ?? false;
  let initialized = profile !== undefined;
  let refreshRequest: Promise<string | undefined> | undefined;

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

  // 会话状态只从存储值派生：本页写入和其他标签页的同步走同一条路径。
  // 值一变，在途刷新就不再代表当前状态，交出槽位让它作废。
  watch(
    stored,
    (value) => {
      refreshRequest = undefined;
      initialized = true;
      profile = value?.profile;
      adminMode = value?.adminMode ?? false;
      for (const listener of listeners) notify(listener);
    },
    { flush: 'sync' },
  );

  function toggleAdminMode(): boolean {
    const nextMode = !adminMode && profile?.role === 'admin';
    if (adminMode === nextMode || !profile) return adminMode;
    stored.value = { profile, adminMode: nextMode };
    return adminMode;
  }

  function setAccessToken(token?: string) {
    const previousUserId = profile?.id;
    const nextProfile = token ? parseAccessToken(token) : undefined;
    stored.value = nextProfile
      ? {
          profile: nextProfile,
          adminMode:
            nextProfile.role === 'admin' &&
            nextProfile.id === previousUserId &&
            adminMode,
        }
      : undefined;
  }

  function subscribe(listener: (user?: SessionUser) => void) {
    listeners.add(listener);
    notify(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function refreshAccessToken(): Promise<string | undefined> {
    if (refreshRequest) return refreshRequest;
    const app = options.app;

    // 槽位里放的就是这个 promise：赋值在第一个 await 恢复之前完成，
    // 之后用 refreshRequest !== request 判断自己有没有被登出或外部变更作废。
    let request!: Promise<string | undefined>;
    request = (async () => {
      try {
        const token = await options.requestRefresh(app);
        // 槽位已被清空：这次结果已经过期，不再应用。
        if (refreshRequest !== request) return profile?.token;
        // 先交出槽位再写值，否则自己的写入会把自己判成过期。
        refreshRequest = undefined;
        setAccessToken(token);
        initialized = true;
        return token;
      } catch (error) {
        if (refreshRequest !== request) return profile?.token;
        refreshRequest = undefined;
        if (isHTTPError(error) && error.response.status === 401) {
          setAccessToken();
          initialized = true;
          return;
        }
        throw error;
      } finally {
        if (refreshRequest === request) refreshRequest = undefined;
      }
    })();
    refreshRequest = request;
    return request;
  }

  async function checkSignedIn() {
    if (!initialized) {
      try {
        await refreshAccessToken();
      } catch {
        // A transient failure leaves the session uninitialized so the next
        // check can retry while preserving any locally available profile.
      }
    }
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

  void checkSignedIn().catch(() => undefined);
  globalThis.setInterval(() => {
    if (
      profile &&
      Date.now() - profile.issuedAt * 1000 >= ACCESS_TOKEN_REFRESH_AGE
    ) {
      void refreshAccessToken().catch(() => undefined);
    }
  }, ACCESS_TOKEN_REFRESH_INTERVAL);

  return {
    accessToken,
    checkSignedIn,
    toggleAdminMode,
    async logout() {
      // 清空槽位即作废在途刷新（包括它们的错误），值没变也成立。
      refreshRequest = undefined;
      initialized = true;
      setAccessToken();
      return options.requestLogout();
    },
    subscribe,
  };
}
