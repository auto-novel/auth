import {
  AuthUser,
  createAuthApi,
  roleLabels,
  type UserRole,
} from '@novelia/auth-api';
import { computed, readonly, ref, type App, type DeepReadonly } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import { createAttention } from './attentionContext';
import { webKitKey } from './context';
import { Notify } from './notifications';
import { createWebTheme } from './theme';
import type { WebKit, WebKitContext, WebKitOptions, Whoami } from './types';

let created = false;

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
    throw new Error(
      'createWebKit can only be called once per module runtime, even after dispose().',
    );
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
    themeStorageKey: options.themeStorageKey,
  });
  let storage: Storage | undefined;
  try {
    storage = window.localStorage;
  } catch {
    // Keep the session in memory when browser storage is blocked.
  }
  const api = createAuthApi({
    autoStart: false,
    app: normalizedOptions.auth.app,
    url: normalizedOptions.auth.url,
    storage: storage
      ? {
          key:
            normalizedOptions.auth.storageKey ??
            `${normalizedOptions.auth.app}-session`,
          target: storage,
        }
      : undefined,
  });
  const profile = ref<AuthUser>();
  let unsubscribe: (() => void) | undefined;
  const attention = createAttention(api);
  // 谓词闭包读取 profile，解构出去后也不会拿到过期快照。
  const predicates = {
    hasRoleAtLeast: (role: UserRole) =>
      AuthUser.hasRoleAtLeast(profile.value, role),
    isAtLeastDaysOld: (days: number) =>
      AuthUser.isAtLeastDaysOld(profile.value, days),
  };
  const whoami = computed<Whoami>(() => {
    const user = profile.value;
    const role = user?.role;
    return {
      // 将 auth-api 的秒时间戳转为毫秒，并保持对外快照只读。
      user: user
        ? readonly({ ...user, createdAt: user.createdAt * 1000 })
        : undefined,
      isSignedIn: user !== undefined,
      isAdmin: AuthUser.isAdmin(user),
      asAdmin: AuthUser.asAdmin(user),
      roleLabel: role ? (roleLabels[role] ?? role) : '未知角色',
      ...predicates,
    };
  });
  const theme = createWebTheme(
    normalizedOptions.themeStorageKey ??
      `${normalizedOptions.auth.app}-web-theme`,
    storage,
  );

  let owner: App | undefined;
  let started = false;
  let disposed = false;

  function start() {
    if (disposed) throw new Error('Cannot start a disposed web kit.');
    if (started) return;
    started = true;
    try {
      theme.start();
      unsubscribe = api.watchUser((user) => {
        profile.value = user;
      });
      api.start();
      attention.start();
    } catch (error) {
      dispose();
      throw error;
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    theme.dispose();
    attention.dispose();
    unsubscribe?.();
    unsubscribe = undefined;
    api.dispose();
    profile.value = undefined;
    if (started) Notify.dismissAll();
  }

  const context: WebKitContext = Object.freeze({
    options: normalizedOptions,
    api,
    whoami,
    attention: attention.context,
    theme: theme.context,
  });
  const kit: WebKit = {
    ...context,
    start,
    dispose,
    install(app: App) {
      if (disposed) throw new Error('Web kit has been disposed.');
      if (owner === app) return;
      if (owner)
        throw new Error('Web kit is already installed in another app.');
      owner = app;
      try {
        start();
        app.provide(webKitKey, context);
        app.onUnmount(dispose);
      } catch (error) {
        dispose();
        throw error;
      }
    },
  };

  created = true;
  return Object.freeze(kit);
}
