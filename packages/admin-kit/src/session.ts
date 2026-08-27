import { computed, readonly, ref } from 'vue';

import { ApiError, type AuthApi } from '@novelia/auth-api';

import type { AuthSession, UserProfile } from './types';

export function createAdminSession(api: AuthApi): AuthSession {
  const profile = ref<UserProfile>();
  let initialized = false;
  let initializeRequest: Promise<void> | undefined;

  api.subscribeUserProfile((nextProfile) => {
    profile.value = nextProfile;
  });

  async function refresh() {
    await api.auth.refresh();
  }

  function initialize() {
    if (initialized) return Promise.resolve();
    if (initializeRequest) return initializeRequest;

    initializeRequest = refresh()
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

  async function logout() {
    try {
      await api.auth.logout();
    } catch {
      // Local logout still succeeds when the server session has expired.
    }
  }

  const isSignedIn = computed(() => profile.value !== undefined);
  const isAuthorized = computed(() => profile.value?.role === 'admin');

  return {
    profile: readonly(profile),
    isSignedIn,
    isAuthorized,
    initialize,
    refresh,
    logout,
  };
}
