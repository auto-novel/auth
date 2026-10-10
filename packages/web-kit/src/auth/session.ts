import { isHTTPError } from 'ky';
import { computed, readonly, shallowRef, watch } from 'vue';

import { useLocalStorage } from '../storage';
import type { AccessTokenProvider } from './client';
import { isKnownRole, roleLabels, type UserRole } from './role';
import type { Whoami, WhoamiUser } from './whoami';

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

interface AuthSessionOptions {
  app: string;
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
  const restored = stored.value;
  let profile = restored ? parseAccessToken(restored.token) : undefined;
  let adminMode = restored?.adminMode ?? false;
  let initialized = profile !== undefined;
  let refreshRequest: Promise<string | undefined> | undefined;

  // 用户快照是 whoami 的内部状态；token 与 adminMode 仍是两个纯变量。
  // 每次赋新对象，watch 按 Object.is 判等，原地改字段不会触发订阅者。
  const user = shallowRef<WhoamiUser>();
  function syncUser() {
    const snapshot = profile
      ? {
          id: profile.id,
          username: profile.username,
          role: profile.role,
          createdAt: profile.createdAt,
          adminMode,
        }
      : undefined;
    try {
      user.value = snapshot;
    } catch {
      // 观察者的异常不能改变 token 操作的结果：值已经写入，只是开发者
      // 模式下 Vue 会把 watcher 回调里的错误重新抛出来，必须在这里挡住。
    }
  }
  syncUser();

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
      const role = user.value?.role;
      return (
        isKnownRole(role) &&
        isKnownRole(requiredRole) &&
        roleLevels[role] >= roleLevels[requiredRole]
      );
    },
    isAtLeastDaysOld: (days: number) => {
      const snapshot = user.value;
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
    const snapshot = user.value;
    const role = snapshot?.role;
    const isAdmin = role === 'admin';
    return {
      user: snapshot ? readonly({ ...snapshot }) : undefined,
      isSignedIn: snapshot !== undefined,
      isAdmin,
      asAdmin: isAdmin && snapshot?.adminMode === true,
      roleLabel: role ? (roleLabels[role] ?? role) : '未知角色',
      ...predicates,
    };
  });

  // 会话状态只从存储值派生：本页写入和其他标签页的同步走同一条路径。
  // 值一变，在途刷新就不再代表当前状态，交出槽位让它作废。
  watch(
    stored,
    (value) => {
      refreshRequest = undefined;
      initialized = true;
      profile = value ? parseAccessToken(value.token) : undefined;
      adminMode = value?.adminMode ?? false;
      syncUser();
    },
    { flush: 'sync' },
  );

  function toggleAdminMode(): boolean {
    const nextMode = !adminMode && profile?.role === 'admin';
    if (adminMode === nextMode || !profile) return adminMode;
    stored.value = { token: profile.token, adminMode: nextMode };
    return adminMode;
  }

  function setAccessToken(token?: string) {
    const previousUserId = profile?.id;
    const nextProfile = token ? parseAccessToken(token) : undefined;
    stored.value = nextProfile
      ? {
          token: nextProfile.token,
          adminMode:
            nextProfile.role === 'admin' &&
            nextProfile.id === previousUserId &&
            adminMode,
        }
      : undefined;
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
        // 保留槽位直到解析成功，避免把解析异常误判为请求已作废。
        // 写入成功后，stored 的同步 watcher 会清空槽位。
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
    whoami,
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
  };
}
