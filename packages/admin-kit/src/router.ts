import type { NavigationGuard } from 'vue-router';

import type { AdminKit } from './types';

export const ADMIN_HOME_ROUTE = '/';
export const ADMIN_LOGIN_ROUTE_NAME = 'login';

export function createAdminAuthGuard(kit: AdminKit): NavigationGuard {
  return async (to) => {
    const isSignedIn = await kit.api.checkSignedIn();

    if (to.meta.requiresAuth && !isSignedIn) {
      return {
        name: ADMIN_LOGIN_ROUTE_NAME,
        query:
          to.fullPath === ADMIN_HOME_ROUTE
            ? undefined
            : { redirect: to.fullPath },
      };
    }

    if (to.meta.guestOnly && isSignedIn) {
      return ADMIN_HOME_ROUTE;
    }
  };
}
