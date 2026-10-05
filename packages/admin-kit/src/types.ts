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
  readonly options: DeepReadonly<AdminKitOptions>;
  readonly api: AuthApi;
  readonly profile: DeepReadonly<Ref<AuthUser | undefined>>;
  readonly isSignedIn: ComputedRef<boolean>;
  readonly isAuthorized: ComputedRef<boolean>;
  readonly theme: AdminTheme;
}

export interface AdminKit extends AdminKitContext {
  /** 启动会话和主题；重复调用无副作用，install 也会调用它。 */
  readonly start: () => void;
  readonly install: (app: App) => void;
  /** 释放已启动的资源；重复调用无副作用，释放后不可重新启动。 */
  readonly dispose: () => void;
}
