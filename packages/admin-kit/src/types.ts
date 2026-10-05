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
  /** 唯一标识，不作为路由路径使用。 */
  key: string | number;
} & (
    | { to: RouteLocationRaw; onSelect?: never; children?: never }
    | { to?: never; onSelect: () => void; children?: never }
    | { to?: never; onSelect?: never; children: AdminKitMenuOption[] }
  );

export interface AdminKitContext {
  options: DeepReadonly<AdminKitOptions>;
  api: AuthApi;
  profile: DeepReadonly<Ref<AuthUser | undefined>>;
  isSignedIn: ComputedRef<boolean>;
  isAuthorized: ComputedRef<boolean>;
  theme: AdminTheme;
}

export interface AdminKit extends AdminKitContext {
  /** 启动会话和主题；重复调用无副作用，install 也会调用它。 */
  start(): void;
  install(app: App): void;
  /** 释放已启动的资源；重复调用无副作用，释放后不可重新启动。 */
  dispose(): void;
}
