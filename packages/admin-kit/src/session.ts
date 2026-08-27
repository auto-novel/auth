import { computed, readonly, ref } from 'vue';

import type { AuthApi } from '@novelia/auth-api';

import type { AuthSession, UserProfile } from './types';

export function createAuthSession(api: AuthApi): AuthSession {
  const profile = ref<UserProfile>();
  let initializeRequest: Promise<void> | undefined;

  api.subscribeUserProfile((nextProfile) => {
    profile.value = nextProfile;
  });

  async function refresh() {
    await api.auth.refresh();
  }

  function initialize() {
    return (initializeRequest ??= refresh().catch(() => {
      // Anonymous visits are expected; the login route remains available.
    }));
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
