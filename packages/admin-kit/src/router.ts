import type { NavigationGuard } from 'vue-router';

import { getAdminKitContext } from './context';
import type { AdminKit } from './types';

export function createAdminAuthGuard(kit: AdminKit): NavigationGuard {
  const { session } = getAdminKitContext(kit);

  return async (to) => {
    await session.initialize();

    if (to.meta.requiresAuth && !session.isSignedIn.value) {
      return {
        name: 'login',
        query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
      };
    }

    if (to.meta.guestOnly && session.isSignedIn.value) {
      return '/';
    }
  };
}
