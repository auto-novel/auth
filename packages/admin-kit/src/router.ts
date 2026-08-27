import type { NavigationGuard } from 'vue-router';

import type { AdminKit } from './types';

export const ADMIN_HOME_ROUTE = '/';
export const ADMIN_LOGIN_ROUTE_NAME = 'login';

export function createAdminAuthGuard(kit: AdminKit): NavigationGuard {
  const { session } = kit;

  return async (to) => {
    await session.initialize();

    if (to.meta.requiresAuth && !session.isSignedIn.value) {
      return {
        name: ADMIN_LOGIN_ROUTE_NAME,
        query:
          to.fullPath === ADMIN_HOME_ROUTE
            ? undefined
            : { redirect: to.fullPath },
      };
    }

    if (to.meta.guestOnly && session.isSignedIn.value) {
      return ADMIN_HOME_ROUTE;
    }
  };
}
