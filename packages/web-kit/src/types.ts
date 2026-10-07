import type { AuthApi, AuthUser, UserRole } from './auth/index';
import type { App, Component, ComputedRef, DeepReadonly } from 'vue';
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

/**
 * 会话用户，`createdAt` 使用毫秒；账号年龄使用 `whoami.isAtLeastDaysOld(days)`，
 * 不要传给按秒计算的 `AuthUser.isAtLeastDaysOld`。
 */
export type WhoamiUser = DeepReadonly<AuthUser>;

/**
 * 会话视图：登录状态、角色判定和派生展示字段的统一入口。
 * 权限规则由 认证模块的 `AuthUser` 提供，这里只做响应式包装。
 */
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

export interface WebKitContext {
  readonly options: DeepReadonly<WebKitResolvedOptions>;
  readonly api: AuthApi;
  readonly whoami: ComputedRef<Whoami>;
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
