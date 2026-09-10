import { inject, type InjectionKey } from 'vue';

import type { WebKit } from './types';

export const webKitKey: InjectionKey<WebKit> = Symbol('web-kit');

export function useWebKit() {
  const kit = inject(webKitKey);
  if (!kit) {
    throw new Error('Web kit is not installed. Call app.use(webKit).');
  }
  return kit;
}

export function useWebTheme() {
  return useWebKit().theme;
}
