import { computed, readonly, ref } from 'vue';

import {
  logout as logoutRequest,
  parseAccessToken,
  refresh as refreshApi,
  type ApiRequestOptions,
} from '@novelia/auth-api';

import type { AdminKitOptions, AuthSession, UserProfile } from './types';

export function createAuthSession(options: AdminKitOptions): AuthSession {
  const storageKey = `${options.auth.app}-admin-session`;
  const authUrl = new URL(options.auth.url, window.location.origin).toString();
  const apiUrl = new URL('api/v1/', authUrl);
  const requestOptions: ApiRequestOptions = { baseUrl: apiUrl.toString() };
  const profile = ref<UserProfile>();
  let initialized = false;
  let refreshRequest: Promise<void> | undefined;
  let initializeRequest: Promise<void> | undefined;

  function saveProfile(nextProfile?: UserProfile) {
    profile.value = nextProfile;
    if (nextProfile) {
      localStorage.setItem(storageKey, JSON.stringify(nextProfile));
    } else {
      localStorage.removeItem(storageKey);
    }
  }

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const storedProfile = JSON.parse(stored) as UserProfile;
      const restored = parseAccessToken(storedProfile.token);
      if (Date.now() < restored.expiredAt * 1000) profile.value = restored;
      else localStorage.removeItem(storageKey);
    }
  } catch {
    localStorage.removeItem(storageKey);
  }

  async function refresh() {
    if (refreshRequest) return refreshRequest;

    refreshRequest = refreshApi(options.auth.app, requestOptions)
      .then((token) => {
        saveProfile(parseAccessToken(token));
      })
      .catch((error) => {
        if (
          error instanceof Error &&
          'status' in error &&
          error.status === 401
        ) {
          saveProfile();
        }
        throw error;
      })
      .finally(() => {
        refreshRequest = undefined;
      });
    return refreshRequest;
  }

  function initialize() {
    if (initialized) return;
    if (initializeRequest) return initializeRequest;

    initializeRequest = refresh()
      .catch(() => {
        // Anonymous visits are expected; the login route remains available.
      })
      .finally(() => {
        initialized = true;
        initializeRequest = undefined;
      });
    return initializeRequest;
  }

  async function logout() {
    saveProfile();
    try {
      await logoutRequest(requestOptions);
    } catch {
      // Local logout still succeeds when the server session has expired.
    }
  }

  const isSignedIn = computed(() => profile.value !== undefined);
  const isAuthorized = computed(() => {
    if (!profile.value) return false;
    return profile.value.role === 'admin';
  });

  window.setInterval(
    () => {
      const issuedAt = profile.value?.issuedAt;
      if (issuedAt && Date.now() - issuedAt * 1000 >= 60 * 60 * 1000) {
        void refresh().catch(() => undefined);
      }
    },
    15 * 60 * 1000,
  );

  return {
    profile: readonly(profile),
    isSignedIn,
    isAuthorized,
    initialize,
    refresh,
    logout,
    getAccessToken: () => profile.value?.token,
    async refreshAccessToken() {
      await refresh();
      return profile.value?.token;
    },
  };
}
