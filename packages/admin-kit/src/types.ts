import type { AuthApi, AuthUser } from '@novelia/auth-api';
import type { App, ComputedRef, DeepReadonly, Ref } from 'vue';
import type { MenuOption } from 'naive-ui';
import type { RouteLocationRaw } from 'vue-router';

import type { AdminTheme } from './theme';

export interface AdminKitOptions {
  auth: {
    app: string;
    url: string;
  };
  brand: string;
  repository?: {
    url: string;
    buildTime: string;
    commitSha: string;
  };
}

export type AdminKitMenuOption = MenuOption & {
  /** Route target for navigational items. Omit it for actions. */
  to?: RouteLocationRaw;
  children?: AdminKitMenuOption[];
};

export interface AdminKitContext {
  options: DeepReadonly<AdminKitOptions>;
  api: AuthApi;
  profile: Readonly<Ref<AuthUser | undefined>>;
  isSignedIn: ComputedRef<boolean>;
  isAuthorized: ComputedRef<boolean>;
  theme: AdminTheme;
}

export interface AdminKit extends AdminKitContext {
  install(app: App): void;
}
