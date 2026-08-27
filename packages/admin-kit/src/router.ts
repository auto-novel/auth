import type { NavigationGuard } from 'vue-router';

import { ApiError } from '@novelia/auth-api';

import type { AdminKit } from './types';

export const ADMIN_HOME_ROUTE = '/';
export const ADMIN_LOGIN_ROUTE_NAME = 'login';

export function createAdminAuthGuard(kit: AdminKit): NavigationGuard {
  let initialized = false;
  let initializeRequest: Promise<void> | undefined;

  function initialize() {
    if (initialized) return Promise.resolve();
    if (initializeRequest) return initializeRequest;

    initializeRequest = kit.api.auth
      .refresh()
      .then(() => {
        initialized = true;
      })
      .catch((error: unknown) => {
        // Anonymous visits are initialized too; transient failures are retried
        // on the next navigation.
        if (error instanceof ApiError && error.status === 401) {
          initialized = true;
        }
      })
      .finally(() => {
        initializeRequest = undefined;
      });
    return initializeRequest;
  }

  return async (to) => {
    await initialize();

    if (to.meta.requiresAuth && !kit.isSignedIn.value) {
      return {
        name: ADMIN_LOGIN_ROUTE_NAME,
        query:
          to.fullPath === ADMIN_HOME_ROUTE
            ? undefined
            : { redirect: to.fullPath },
      };
    }

    if (to.meta.guestOnly && kit.isSignedIn.value) {
      return ADMIN_HOME_ROUTE;
    }
  };
}
