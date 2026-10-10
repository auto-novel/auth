import { isAccountAtLeastDaysOld, type SessionUser } from './auth/user';
import { isRoleAtLeast, roleLabels, type UserRole } from './auth/role';
import {
  createApiClient,
  createAuthAwareApiClient,
  type ApiClientOptions,
} from './auth/client';
import { createAuthSession } from './auth/session';
import { createAuthRequests } from './auth/requests';
import { createLoginBridge } from './auth/login';
import { computed, readonly, ref, type App, type DeepReadonly } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import { createAttention } from './attentionContext';
import { accountActionsKey, loadMyStrikesKey } from './auth/context';
import { webKitKey, webKitInternalsKey } from './context';
import { createWebTheme } from './theme';
import type { WebKit, WebKitContext, WebKitOptions, Whoami } from './types';

let created = false;

const SESSION_STORAGE_KEY = 'web-kit:session:v1';
const THEME_STORAGE_KEY = 'web-kit:theme:v1';

/** 相对地址需要浏览器环境；绝对地址在任何环境都能解析。 */
function resolveAuthUrl(url: string): string {
  const base =
    typeof window === 'undefined' ? undefined : window.location.origin;
  try {
    return new URL(url, base).toString();
  } catch {
    throw new Error(
      `Web kit cannot resolve auth.url (${JSON.stringify(url)}). ` +
        'Use an absolute URL outside the browser.',
    );
  }
}

/** 按 Router 读取的公开字段取快照，兼容继承属性和 getter。 */
function snapshotRouteTarget(
  target: RouteLocationRaw,
): DeepReadonly<RouteLocationRaw> {
  if (typeof target === 'string') return target;
  const route: Record<string, unknown> = {};
  for (const key of [
    'path',
    'name',
    'params',
    'query',
    'hash',
    'replace',
    'force',
    'state',
  ]) {
    if (key in target) route[key] = Reflect.get(target, key);
  }
  // Router 的 params/query 按 for...in 读取，包括继承的可枚举字段。
  for (const key of ['params', 'query']) {
    const record = route[key];
    if (record && typeof record === 'object') {
      const entries: [string, unknown][] = [];
      for (const field in record)
        entries.push([field, Reflect.get(record, field)]);
      route[key] = Object.fromEntries(entries);
    }
  }
  const seen = new WeakMap<object, object>();
  function copy(value: unknown): unknown {
    if (value === null || typeof value !== 'object') return value;
    const existing = seen.get(value);
    if (existing) return existing;
    const result = Array.isArray(value) ? new Array(value.length) : {};
    seen.set(value, result);
    for (const [key, child] of Object.entries(value)) {
      Object.defineProperty(result, key, {
        value: copy(child),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return Object.freeze(result);
  }
  return copy(route) as DeepReadonly<RouteLocationRaw>;
}

/** 每个模块运行环境只创建一次，并且只安装到一个 Vue 应用。 */
export function createWebKit(options: WebKitOptions): WebKit {
  if (created) {
    throw new Error('createWebKit can only be called once per module runtime.');
  }
  const normalizedOptions = Object.freeze({
    auth: Object.freeze({
      ...options.auth,
      url: resolveAuthUrl(options.auth.url),
    }),
    brand: options.brand,
    repository: options.repository
      ? Object.freeze({ ...options.repository })
      : undefined,
    strikes: Object.freeze({
      enabled: options.strikes?.enabled ?? true,
      to: snapshotRouteTarget(options.strikes?.to ?? '/strikes'),
    }),
  });
  let storage: Storage | undefined;
  try {
    storage = window.localStorage;
  } catch {
    // Keep the session in memory when browser storage is blocked.
  }
  const authUrl = new URL(normalizedOptions.auth.url);
  const authClient = createApiClient(new URL('api/v1/', authUrl).toString());
  const session = createAuthSession({
    app: normalizedOptions.auth.app,
    storageKey: SESSION_STORAGE_KEY,
    storageArea: storage,
    requestLogout: () =>
      authClient.post('auth/logout', { credentials: 'include' }).text(),
    requestRefresh: (app) =>
      authClient
        .post('auth/refresh', {
          credentials: 'include',
          searchParams: { app },
        })
        .text(),
  });
  const profile = ref<SessionUser>();
  session.subscribe((user) => {
    profile.value = user;
  });
  const requests = createAuthRequests(
    createAuthAwareApiClient(authClient, session.accessToken),
  );
  const accountActions = Object.freeze({
    ...createLoginBridge(
      authUrl,
      normalizedOptions.auth.app,
      session.accessToken.refresh,
    ),
    toggleAdminMode: session.toggleAdminMode,
  });
  const attention = createAttention({
    watchUser: session.subscribe,
    getAttentionStatus: requests.getAttentionStatus,
    updateMyStrikeReadState: requests.updateMyStrikeReadState,
  });
  // 谓词闭包读取 profile，解构出去后也不会拿到过期快照。
  const predicates = {
    hasRoleAtLeast: (role: UserRole) =>
      isRoleAtLeast(profile.value?.role, role),
    isAtLeastDaysOld: (days: number) =>
      isAccountAtLeastDaysOld(profile.value, days),
  };
  const whoami = computed<Whoami>(() => {
    const user = profile.value;
    const role = user?.role;
    const isAdmin = isRoleAtLeast(role, 'admin');
    return {
      user: user ? readonly({ ...user }) : undefined,
      isSignedIn: user !== undefined,
      isAdmin,
      asAdmin: isAdmin && user?.adminMode === true,
      roleLabel: role ? (roleLabels[role] ?? role) : '未知角色',
      ...predicates,
    };
  });
  const theme = createWebTheme(THEME_STORAGE_KEY, storage);
  let owner: App | undefined;

  const context: WebKitContext = Object.freeze({
    createClient(baseUrl: string, options: ApiClientOptions = {}) {
      return createAuthAwareApiClient(
        createApiClient(baseUrl, options),
        session.accessToken,
      );
    },
    checkSignedIn: session.checkSignedIn,
    logout: session.logout,
    banUser: requests.banUser,
    createStrike: requests.createStrike,
    whoami,
    theme,
  });
  const kit: WebKit = {
    ...context,
    install(app: App) {
      if (owner === app) return;
      if (owner)
        throw new Error('Web kit is already installed in another app.');
      owner = app;
      app.provide(webKitKey, context);
      app.provide(
        webKitInternalsKey,
        Object.freeze({
          options: normalizedOptions,
          attention,
        }),
      );
      app.provide(accountActionsKey, accountActions);
      app.provide(loadMyStrikesKey, requests.getMyStrikes);
    },
  };

  created = true;
  return Object.freeze(kit);
}
