import type { SessionUser } from './auth/user';
import type { UserRole } from './auth/role';
import type { ApiClient, ApiClientOptions } from './auth/client';
import type {
  BanUserRequest,
  CreateStrikeRequest,
  CreateStrikeResponse,
} from './auth/requests';
import type { App, Component, ComputedRef, DeepReadonly } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

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

/** 只读会话用户快照，createdAt 使用 Unix 毫秒。 */
export type WhoamiUser = DeepReadonly<SessionUser>;

/** 会话视图：登录状态、角色判定和派生展示字段的统一入口。 */
export interface Whoami {
  /** 会话用户快照；未登录为 `undefined`。 */
  readonly user: WhoamiUser | undefined;
  readonly isSignedIn: boolean;
  readonly isAdmin: boolean;
  /** 角色至少为 admin 且已打开管理模式，与账号菜单里的 “+” 同源。 */
  readonly asAdmin: boolean;
  /** 本地化的角色名，未登录或角色未知时为“未知角色”。 */
  readonly roleLabel: string;
  hasRoleAtLeast(role: UserRole): boolean;
  isAtLeastDaysOld(days: number): boolean;
}

/** 宿主共享的状态与操作；会话生命周期由 kit 统一管理。 */
export interface WebKitContext {
  readonly createClient: (
    baseUrl: string,
    options?: ApiClientOptions,
  ) => ApiClient;
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
  /** 启动会话、主题和提醒；重复调用无副作用，install 也会调用它。 */
  readonly start: () => void;
  readonly install: (app: App) => void;
  /** 释放已启动的资源；重复调用无副作用，释放后不可重新启动。 */
  readonly dispose: () => void;
}
