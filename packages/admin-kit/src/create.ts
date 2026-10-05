import { computed, readonly, ref, type App } from 'vue';

import { createAuthApi, type AuthUser } from '@novelia/auth-api';

import { adminKitKey } from './context';
import { createAdminTheme } from './theme';
import type { AdminKit, AdminKitContext, AdminKitOptions } from './types';

let created = false;

export function createAdminKit(options: AdminKitOptions): AdminKit {
  if (created) {
    throw new Error(
      'createAdminKit can only be called once per module runtime, even after dispose().',
    );
  }

  const normalizedOptions = Object.freeze({
    auth: Object.freeze({
      ...options.auth,
      url: new URL(
        options.auth.url,
        typeof window === 'undefined' ? undefined : window.location.origin,
      ).toString(),
    }),
    brand: options.brand,
    repository: options.repository
      ? Object.freeze({ ...options.repository })
      : undefined,
  });
  let storage: Storage | undefined;
  try {
    storage = window.localStorage;
  } catch {
    // Keep the session in memory when browser storage is blocked.
  }
  const theme = createAdminTheme(
    `${normalizedOptions.auth.app}-admin-theme`,
    storage,
  );
  const api = createAuthApi({
    autoStart: false,
    app: normalizedOptions.auth.app,
    url: normalizedOptions.auth.url,
    storage: storage
      ? { key: `${normalizedOptions.auth.app}-admin-session`, target: storage }
      : undefined,
  });
  const profile = ref<AuthUser>();
  let unsubscribe: (() => void) | undefined;
  const context: AdminKitContext = {
    options: normalizedOptions,
    api,
    profile: readonly(profile),
    isSignedIn: computed(() => profile.value !== undefined),
    isAuthorized: computed(() => profile.value?.role === 'admin'),
    theme: theme.context,
  };
  let owner: App | undefined;
  let started = false;
  let disposed = false;

  function start() {
    if (disposed) throw new Error('Cannot start a disposed admin kit.');
    if (started) return;
    started = true;
    try {
      theme.start();
      unsubscribe = api.watchUser((user) => {
        profile.value = user;
      });
      api.start();
    } catch (error) {
      dispose();
      throw error;
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    theme.dispose();
    unsubscribe?.();
    unsubscribe = undefined;
    api.dispose();
    profile.value = undefined;
  }

  const kit: AdminKit = {
    ...context,
    start,
    install(app: App) {
      if (disposed) throw new Error('Cannot install a disposed admin kit.');
      if (owner === app) return;
      if (owner) {
        throw new Error('An admin kit can only be installed on one Vue app.');
      }
      owner = app;
      try {
        start();
        app.provide(adminKitKey, context);
        app.onUnmount(dispose);
      } catch (error) {
        dispose();
        throw error;
      }
    },
    dispose,
  };

  created = true;
  return kit;
}
