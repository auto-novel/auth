import { createAuthApi, type AuthUser } from '@novelia/auth-api';
import { computed, readonly, ref, type App } from 'vue';

import { createAttention } from './attentionContext';
import { webKitKey } from './context';
import { Notify } from './notifications';
import { createWebTheme } from './theme';
import type { WebKit, WebKitContext, WebKitOptions } from './types';

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
      to: options.strikes?.to ?? '/strikes',
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
  const unsubscribe = api.watchUser((user) => {
    profile.value = user;
  });
  const attention = createAttention(api);
  const isSignedIn = computed(() => profile.value !== undefined);
  const theme = createWebTheme(
    normalizedOptions.themeStorageKey ??
      `${normalizedOptions.auth.app}-web-theme`,
    storage,
  );

  let owner: App | undefined;
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    theme.dispose();
    attention.dispose();
    unsubscribe();
    api.dispose();
    Notify.dismissAll();
  }

  const context: WebKitContext = {
    options: normalizedOptions,
    api,
    profile: readonly(profile),
    isSignedIn,
    attention: attention.context,
    theme: theme.context,
  };
  const kit: WebKit = {
    ...context,
    dispose,
    install(app: App) {
      if (disposed) throw new Error('Web kit has been disposed.');
      if (owner === app) return;
      if (owner)
        throw new Error('Web kit is already installed in another app.');
      owner = app;
      app.provide(webKitKey, context);
      app.onUnmount(dispose);
      // Auth session starts during creation; UI theme and attention start here.
      theme.start();
      attention.start();
    },
  };

  created = true;
  return kit;
}
