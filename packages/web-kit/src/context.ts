import { inject, type InjectionKey } from 'vue';

import type { WebKitContext } from './types';

export const webKitKey: InjectionKey<WebKitContext> = Symbol('web-kit');

export function useWebKit(): WebKitContext {
  const kit = inject(webKitKey);
  if (!kit) {
    throw new Error('Web kit is not installed. Call app.use(webKit).');
  }
  return kit;
}

export function useWebTheme() {
  return useWebKit().theme;
}

export function useAttention() {
  return useWebKit().attention;
}
