import AdminLoginView from './components/AdminLoginView.vue';
import AdminKitApp from './components/AdminKitApp.vue';
import AdminKitLayout from './components/AdminKitLayout.vue';
import { useAdminKit } from './context';

export { createAdminKit } from './create';
export { createAdminAuthGuard } from './router';

export { AdminLoginView, AdminKitApp, AdminKitLayout, useAdminKit };
export type {
  AdminKit,
  AdminKitContext,
  AdminKitMenuOption,
  AdminKitOptions,
} from './types';
export type { AdminTheme } from './theme';
