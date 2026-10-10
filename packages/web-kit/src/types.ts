import type { Whoami } from './auth/whoami';
import type { ApiClientOptions } from './api/client';
import type {
  BanUserRequest,
  CreateStrikeRequest,
  CreateStrikeResponse,
} from './api/requests';
import type { App, Component, ComputedRef } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import type { WebTheme } from './theme';
import type { KyInstance } from 'ky';

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
  };
  brand: string;
  repository?: {
    url: string;
    buildTime: string;
    commitSha: string;
  };
  strikes?: WebKitStrikeOptions;
}

/** 宿主注入的菜单项；不指定 type 时兼容原有的站内链接。 */
export type WebKitMenuOption =
  | {
      type?: 'link';
      key: string;
      label: string;
      icon?: Component;
      to: RouteLocationRaw;
    }
  | {
      type: 'divider';
      key: string;
    }
  | {
      type: 'external';
      key: string;
      label: string;
      icon?: Component;
      href: string;
      /** 默认在当前页面打开；传 `_blank` 可在新标签页打开。 */
      target?: '_self' | '_blank';
    }
  | {
      type: 'group';
      key: string;
      label: string;
      icon?: Component;
      children: WebKitMenuOption[];
    };

/** 宿主共享的状态与操作；会话生命周期由 kit 统一管理。 */
export interface WebKitContext {
  readonly createClient: (
    baseUrl: string,
    options?: ApiClientOptions,
  ) => KyInstance;
  readonly checkSignedIn: () => Promise<boolean>;
  readonly logout: () => Promise<string>;
  readonly banUser: (request: BanUserRequest) => Promise<string>;
  readonly createStrike: (
    request: CreateStrikeRequest,
  ) => Promise<CreateStrikeResponse>;
  readonly whoami: ComputedRef<Whoami>;
  readonly theme: WebTheme;
}

export interface WebKit extends WebKitContext {
  readonly install: (app: App) => void;
}
