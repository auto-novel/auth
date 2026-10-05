import type { AuthApi, AuthUser } from '@novelia/auth-api';
import type { App, Component, ComputedRef, DeepReadonly, Ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import type { AttentionContext } from './attentionContext';
import type { WebTheme } from './theme';

export interface WebKitStrikeOptions {
  /** 是否在账号菜单中显示内置的“处罚记录”入口，默认 `true`。 */
  enabled?: boolean;
  /** “处罚记录”入口的路由目标，默认 `'/strikes'`。 */
  to?: RouteLocationRaw;
}

export interface WebKitOptions {
  auth: {
    app: string;
    url: string;
    storageKey?: string;
  };
  brand: string;
  repository?: {
    url: string;
    buildTime: string;
    commitSha: string;
  };
  strikes?: WebKitStrikeOptions;
  themeStorageKey?: string;
}

/** `createWebKit` 补齐默认值后的配置，供 kit 内部组件依赖。 */
export interface WebKitResolvedOptions extends Omit<WebKitOptions, 'strikes'> {
  strikes: Required<WebKitStrikeOptions>;
}

export interface WebKitMenuOption {
  key: string;
  label: string;
  icon: Component;
  to: RouteLocationRaw;
}

export interface WebKitContext {
  readonly options: DeepReadonly<WebKitResolvedOptions>;
  readonly api: AuthApi;
  readonly profile: DeepReadonly<Ref<AuthUser | undefined>>;
  readonly isSignedIn: ComputedRef<boolean>;
  /** 处罚提醒状态，与账号菜单里的未读红点同源。 */
  readonly attention: AttentionContext;
  readonly theme: WebTheme;
}

export interface WebKit extends WebKitContext {
  /** 启动会话、主题和提醒；重复调用无副作用，install 也会调用它。 */
  readonly start: () => void;
  readonly install: (app: App) => void;
  /** 释放已启动的资源；重复调用无副作用，释放后不可重新启动。 */
  readonly dispose: () => void;
}
