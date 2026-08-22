import { inject, type InjectionKey } from 'vue';

import type { AdminKit, AdminKitContext } from './types';
import type { AdminTheme } from './theme';

export const adminKitKey: InjectionKey<AdminKitContext> = Symbol('admin-kit');
export const adminThemeKey: InjectionKey<AdminTheme> = Symbol('admin-theme');
const adminKitContexts = new WeakMap<AdminKit, AdminKitContext>();

export function registerAdminKitContext(
  kit: AdminKit,
  context: AdminKitContext,
) {
  adminKitContexts.set(kit, context);
}

export function getAdminKitContext(kit: AdminKit) {
  const context = adminKitContexts.get(kit);
  if (!context) throw new Error('Invalid admin kit instance.');
  return context;
}

export function useAdminKit() {
  const kit = inject(adminKitKey);
  if (!kit) {
    throw new Error('Admin kit is not installed. Call app.use(adminKit).');
  }
  return kit;
}

export function useAdminTheme() {
  const theme = inject(adminThemeKey);
  if (!theme) {
    throw new Error('Admin kit is not installed. Call app.use(adminKit).');
  }
  return theme;
}
