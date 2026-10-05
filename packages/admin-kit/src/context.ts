import { inject, type InjectionKey } from 'vue';

import type { AdminTheme } from './theme';
import type { AdminKitContext } from './types';

export const adminKitKey: InjectionKey<AdminKitContext> = Symbol('admin-kit');

export function useAdminKit(): AdminKitContext {
  const kit = inject(adminKitKey);
  if (!kit) {
    throw new Error('Admin kit is not installed. Call app.use(adminKit).');
  }
  return kit;
}

export function useAdminTheme(): AdminTheme {
  return useAdminKit().theme;
}
