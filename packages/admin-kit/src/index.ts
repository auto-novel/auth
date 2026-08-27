import { computed, readonly, ref, type App } from 'vue';

import { createAuthApi, type AuthUser } from '@novelia/auth-api';

import AdminLoginView from './components/AdminLoginView.vue';
import AdminKitApp from './components/AdminKitApp.vue';
import AdminKitLayout from './components/AdminKitLayout.vue';
import { adminKitKey, useAdminKit, useAdminTheme } from './context';
import { createAdminTheme } from './theme';
import type { AdminKit, AdminKitOptions } from './types';

export { createAdminAuthGuard } from './router';

export function createAdminKit(options: AdminKitOptions): AdminKit {
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
  const api = createAuthApi({
    app: normalizedOptions.auth.app,
    baseUrl: new URL('api/v1/', normalizedOptions.auth.url).toString(),
    storage: {
      key: `${normalizedOptions.auth.app}-admin-session`,
      target: localStorage,
    },
  });
  const profile = ref<AuthUser>();
  api.subscribeUser((user) => {
    profile.value = user;
  });
  const isSignedIn = computed(() => profile.value !== undefined);
  const isAuthorized = computed(() => profile.value?.role === 'admin');
  const theme = createAdminTheme(`${normalizedOptions.auth.app}-admin-theme`);
  const kit: AdminKit = {
    options: normalizedOptions,
    api,
    profile: readonly(profile),
    isSignedIn,
    isAuthorized,
    theme,
    install(app: App) {
      app.provide(adminKitKey, kit);
    },
  };

  return kit;
}

export {
  AdminLoginView,
  AdminKitApp,
  AdminKitLayout,
  useAdminKit,
  useAdminTheme,
};
export type { AdminKitOptions } from './types';
