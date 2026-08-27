import type { App } from 'vue';

import { createAuthApi } from '@novelia/auth-api';

import AdminLoginView from './components/AdminLoginView.vue';
import AdminKitApp from './components/AdminKitApp.vue';
import AdminKitLayout from './components/AdminKitLayout.vue';
import { adminKitKey, useAdminKit, useAdminTheme } from './context';
import { createAdminSession } from './session';
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
  const session = createAdminSession(api);
  const theme = createAdminTheme(`${normalizedOptions.auth.app}-admin-theme`);
  const kit: AdminKit = {
    options: normalizedOptions,
    api,
    session,
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
export type { AdminKitOptions, AuthSession, UserProfile } from './types';
