import { inject, type DeepReadonly, type InjectionKey } from 'vue';

import type { MyStrikeListParams, MyStrikePage } from './api/requests';
import type {
  WebKitContext,
  WebKitOptions,
  WebKitStrikeOptions,
} from './types';
import type { AttentionContext } from './attentionContext';
import type { createLoginBridge } from './auth/login';

export const webKitKey: InjectionKey<WebKitContext> = Symbol('web-kit');

export function useWebKit(): WebKitContext {
  const kit = inject(webKitKey);
  if (!kit) {
    throw new Error('Web kit is not installed. Call app.use(webKit).');
  }
  return kit;
}

/** 登录 iframe 的能力，加上管理模式开关。 */
type AccountActions = ReturnType<typeof createLoginBridge> & {
  toggleAdminMode(): boolean;
};

type LoadMyStrikes = (params: MyStrikeListParams) => Promise<MyStrikePage>;

/** 内置组件依赖，不从包入口导出。 */
interface WebKitInternals {
  readonly options: DeepReadonly<
    Omit<WebKitOptions, 'strikes'> & {
      strikes: Required<WebKitStrikeOptions>;
    }
  >;
  readonly attention: AttentionContext;
  readonly accountActions: AccountActions;
  readonly loadMyStrikes: LoadMyStrikes;
}

export const webKitInternalsKey: InjectionKey<WebKitInternals> =
  Symbol('web-kit-internals');

export function useWebKitInternals(): WebKitInternals {
  const internals = inject(webKitInternalsKey);
  if (!internals) {
    throw new Error('Web kit is not installed. Call app.use(webKit).');
  }
  return internals;
}
