import type { App } from 'vue';

import { createAuthApi } from '@novelia/auth-api';

import AdminLoginView from './components/AdminLoginView.vue';
import AdminKitApp from './components/AdminKitApp.vue';
import AdminKitLayout from './components/AdminKitLayout.vue';
import {
  adminKitKey,
  adminThemeKey,
  registerAdminKitContext,
  useAdminKit,
  useAdminTheme,
} from './context';
import { createAuthSession } from './session';
import { createAdminTheme } from './theme';
import type { AdminKit, AdminKitOptions } from './types';

export { createAdminAuthGuard } from './router';

export function createAdminKit(options: AdminKitOptions): AdminKit {
  const authUrl = new URL(options.auth.url, window.location.origin).toString();
  const api = createAuthApi({
    ...options.api,
    app: options.auth.app,
    authBaseUrl: new URL('api/v1/', authUrl).toString(),
    storage: {
      key: `${options.auth.app}-admin-session`,
      target: localStorage,
    },
  });
  const session = createAuthSession(api);
  const context = {
    options,
    api,
    session,
  };
  const kit = {
    install(app: App) {
      app.provide(adminKitKey, context);
      app.provide(
        adminThemeKey,
        createAdminTheme(`${options.auth.app}-admin-theme`),
      );
    },
  } satisfies AdminKit;

  registerAdminKitContext(kit, context);
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
