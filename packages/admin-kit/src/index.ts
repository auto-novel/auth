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
  const session = createAuthSession(options);
  const context = {
    options,
    api: createAuthApi({ ...options.api, session }),
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
