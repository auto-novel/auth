import { inject, type InjectionKey } from 'vue';

import type { AdminKit } from './types';

export const adminKitKey: InjectionKey<AdminKit> = Symbol('admin-kit');

export function useAdminKit() {
  const kit = inject(adminKitKey);
  if (!kit) {
    throw new Error('Admin kit is not installed. Call app.use(adminKit).');
  }
  return kit;
}

export function useAdminTheme() {
  return useAdminKit().theme;
}
