import { inject, type InjectionKey } from 'vue';

import type { createLoginBridge } from './login';
import type { MyStrikeListParams, MyStrikePage } from './requests';

interface AccountActions extends ReturnType<typeof createLoginBridge> {
  toggleAdminMode(): boolean;
}

type LoadMyStrikes = (params: MyStrikeListParams) => Promise<MyStrikePage>;

/** 内置组件只取得自身需要的能力；不从包入口导出。 */
export const accountActionsKey: InjectionKey<AccountActions> =
  Symbol('web-kit-account');
export const loadMyStrikesKey: InjectionKey<LoadMyStrikes> =
  Symbol('web-kit-strikes');

function requireInjection<T>(key: InjectionKey<T>): T {
  const value = inject(key);
  if (!value) {
    throw new Error('Web kit is not installed. Call app.use(webKit).');
  }
  return value;
}

export function useAccountActions() {
  return requireInjection(accountActionsKey);
}

export function useMyStrikesLoader() {
  return requireInjection(loadMyStrikesKey);
}
