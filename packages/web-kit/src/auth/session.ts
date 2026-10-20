import { isHTTPError } from 'ky';
import { computed, readonly, watch } from 'vue';

import { useLocalStorage } from '../utils/storage';
import type { AccessTokenProvider } from '../api/client';

import { isKnownRole, roleLabels } from './whoami';
import type { UserRole, Whoami, WhoamiUser } from './whoami';

interface AccessTokenProfile extends Omit<WhoamiUser, 'adminMode'> {
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
const SESSION_STORAGE_KEY = 'web-kit:session:v1';

interface StoredSession {
  token: string;
  adminMode: boolean;
}

interface AuthSessionRequests {
  login(username: string, password: string): Promise<string>;
  logout(): Promise<string>;
  refresh(): Promise<string>;
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

export function createAuthSession(requests: AuthSessionRequests) {
  const stored = useLocalStorage<StoredSession | undefined>(
    SESSION_STORAGE_KEY,
    {
      validate(value) {
        const session = value as {
          token?: unknown;
          adminMode?: unknown;
        } | null;
        if (typeof session?.token !== 'string') return;

        const profile = parseAccessToken(session.token);
        // 过期令牌按无效值处理，由存储层删除。
        if (Date.now() >= profile.expiredAt * 1000) return;

        return {
          token: session.token,
          adminMode: profile.role === 'admin' && session.adminMode === true,
        };
      },
      fallback: () => undefined,
    },
  );
  const profile = computed(() => {
    const token = stored.value?.token;
    return token ? parseAccessToken(token) : undefined;
  });
  let initialized = profile.value !== undefined;
  let refreshRequest: Promise<string | undefined> | undefined;

  // 本页和跨标签页变更都使在途刷新作废；用户信息直接从 stored 派生。
  watch(
    stored,
    () => {
      refreshRequest = undefined;
      initialized = true;
    },
    { flush: 'sync' },
  );

  function writeSession(value: StoredSession | undefined) {
    try {
      stored.value = value;
    } catch {
      // 值和持久化已经更新；开发模式下同步观察者的异常不能让认证操作失败。
    }
  }

  const roleLevels: Readonly<Record<UserRole, number>> = {
    admin: 4,
    trusted: 3,
    member: 2,
    restricted: 1,
    banned: 0,
  };

  // 谓词闭包读取会话 ref，解构出去后也不会拿到过期快照。
  const predicates = {
    hasRoleAtLeast: (requiredRole: UserRole) => {
      const role = profile.value?.role;
      return (
        isKnownRole(role) &&
        isKnownRole(requiredRole) &&
        roleLevels[role] >= roleLevels[requiredRole]
      );
    },
    isAtLeastDaysOld: (days: number) => {
      const snapshot = profile.value;
      const now = Date.now();
      return (
        snapshot !== undefined &&
        Number.isFinite(snapshot.createdAt) &&
        Number.isFinite(days) &&
        days >= 0 &&
        Number.isFinite(now) &&
        now - snapshot.createdAt >= days * 24 * 60 * 60 * 1000
      );
    },
  };
  const whoami = computed<Whoami>(() => {
    const snapshot = profile.value;
    const role = snapshot?.role;
    const isAdmin = role === 'admin';
    return {
      user: snapshot
        ? readonly({
            id: snapshot.id,
            username: snapshot.username,
            role: snapshot.role,
            createdAt: snapshot.createdAt,
            adminMode: stored.value?.adminMode === true,
          })
        : undefined,
      isSignedIn: snapshot !== undefined,
      isAdmin,
      asAdmin: isAdmin && stored.value?.adminMode === true,
      roleLabel: role ? (roleLabels[role] ?? role) : '未知角色',
      ...predicates,
    };
  });

  function toggleAdminMode(): boolean {
    if (profile.value?.role !== 'admin') return false;
    const nextMode = !stored.value?.adminMode;
    writeSession({ token: profile.value.token, adminMode: nextMode });
    return stored.value?.adminMode === true;
  }

  function setAccessToken(token?: string) {
    const nextProfile = token ? parseAccessToken(token) : undefined;
    writeSession(
      nextProfile
        ? {
            token: nextProfile.token,
            adminMode:
              nextProfile.role === 'admin' &&
              nextProfile.id === profile.value?.id &&
              stored.value?.adminMode === true,
          }
        : undefined,
    );
  }

  function refreshAccessToken(): Promise<string | undefined> {
    if (refreshRequest) return refreshRequest;

    // 槽位里放的就是这个 promise：赋值在第一个 await 恢复之前完成，
    // 之后用 refreshRequest !== request 判断自己有没有被登出或外部变更作废。
    let request!: Promise<string | undefined>;
    request = (async () => {
      try {
        const token = await requests.refresh();
        // 槽位已被清空：这次结果已经过期，不再应用。
        if (refreshRequest !== request) return profile.value?.token;
        // 保留槽位直到解析成功，避免把解析异常误判为请求已作废。
        // 写入成功后，stored 的同步 watcher 会清空槽位。
        setAccessToken(token);
        initialized = true;
        return token;
      } catch (error) {
        if (refreshRequest !== request) return profile.value?.token;
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
    return profile.value !== undefined;
  }

  const accessToken = {
    get() {
      return profile.value?.token;
    },
    async ready() {
      await checkSignedIn();
    },
    refresh: refreshAccessToken,
  } satisfies AccessTokenProvider;

  void checkSignedIn().catch(() => undefined);
  globalThis.setInterval(() => {
    if (
      profile.value &&
      Date.now() - profile.value.issuedAt * 1000 >= ACCESS_TOKEN_REFRESH_AGE
    ) {
      void refreshAccessToken().catch(() => undefined);
    }
  }, ACCESS_TOKEN_REFRESH_INTERVAL);

  return {
    whoami,
    accessToken,
    async login(username: string, password: string) {
      const token = await requests.login(username, password);
      if (!token) throw new Error('登录接口未返回有效令牌，请重试');
      setAccessToken(token);
    },
    checkSignedIn,
    toggleAdminMode,
    async logout() {
      // 清空槽位即作废在途刷新（包括它们的错误），值没变也成立。
      refreshRequest = undefined;
      initialized = true;
      setAccessToken();
      return requests.logout();
    },
  };
}
