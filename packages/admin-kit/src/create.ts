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
      url: new URL(options.auth.url, window.location.origin).toString(),
    }),
    brand: options.brand,
    repository: options.repository
      ? Object.freeze({ ...options.repository })
      : undefined,
  });
  const theme = createAdminTheme(`${normalizedOptions.auth.app}-admin-theme`);
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
      ? { key: `${normalizedOptions.auth.app}-admin-session`, target: storage }
      : undefined,
  });
  const profile = ref<AuthUser>();
  const unsubscribe = api.watchUser((user) => {
    profile.value = user;
  });
  const context: AdminKitContext = {
    options: normalizedOptions,
    api,
    profile: readonly(profile),
    isSignedIn: computed(() => profile.value !== undefined),
    isAuthorized: computed(() => profile.value?.role === 'admin'),
    theme,
  };
  let owner: App | undefined;
  let disposed = false;

  function dispose() {
    if (disposed) return;
    disposed = true;
    unsubscribe();
    api.dispose();
  }

  const kit: AdminKit = {
    ...context,
    install(app: App) {
      if (disposed) throw new Error('Cannot install a disposed admin kit.');
      if (owner === app) return;
      if (owner) {
        throw new Error('An admin kit can only be installed on one Vue app.');
      }
      owner = app;
      app.provide(adminKitKey, context);
      app.onUnmount(dispose);
    },
    dispose,
  };

  created = true;
  return kit;
}
