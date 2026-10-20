import { inject, type DeepReadonly, type InjectionKey } from 'vue';

import type { MyStrikeListParams, MyStrikePage } from './api/requests';
import type {
  WebKitContext,
  WebKitOptions,
  WebKitStrikeOptions,
} from './types';
import type { AttentionContext } from './attentionContext';
import type { createAuthSession } from './auth/session';

export const webKitKey: InjectionKey<WebKitContext> = Symbol('web-kit');

export function useWebKit(): WebKitContext {
  const kit = inject(webKitKey);
  if (!kit) {
    throw new Error('Web kit is not installed. Call app.use(webKit).');
  }
  return kit;
}

type LoadMyStrikes = (params: MyStrikeListParams) => Promise<MyStrikePage>;

/** 内置组件依赖，不从包入口导出。 */
interface WebKitInternals {
  readonly options: DeepReadonly<
    Omit<WebKitOptions, 'strikes'> & {
      strikes: Required<WebKitStrikeOptions>;
    }
  >;
  readonly attention: AttentionContext;
  readonly session: ReturnType<typeof createAuthSession>;
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
