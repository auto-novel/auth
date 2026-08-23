import { computed, readonly, ref } from 'vue';

import type { AdminKitOptions, AuthSession, UserProfile } from './types';

interface AccessTokenClaims {
  sub: string;
  role: string;
  crat: number;
  iat: number;
  exp: number;
}

function parseAccessToken(token: string): UserProfile {
  const encodedPayload = token.split('.')[1];
  if (!encodedPayload) throw new Error('访问令牌格式无效');

  const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(paddedBase64), (character) =>
    character.charCodeAt(0),
  );
  const claims = JSON.parse(
    new TextDecoder().decode(bytes),
  ) as AccessTokenClaims;

  if (
    !claims.sub ||
    !claims.role ||
    !Number.isFinite(claims.crat) ||
    !Number.isFinite(claims.iat) ||
    !Number.isFinite(claims.exp)
  ) {
    throw new Error('访问令牌内容无效');
  }

  return {
    token,
    username: claims.sub,
    role: claims.role,
    createdAt: claims.crat,
    issuedAt: claims.iat,
    expiredAt: claims.exp,
  };
}

export function createAuthSession(options: AdminKitOptions): AuthSession {
  const storageKey = `${options.auth.app}-admin-session`;
  const authUrl = new URL(options.auth.url, window.location.origin).toString();
  const apiUrl = new URL('api/v1/', authUrl);
  const profile = ref<UserProfile>();
  let initialized = false;
  let refreshRequest: Promise<void> | undefined;
  let initializeRequest: Promise<void> | undefined;

  async function post(path: string, searchParams?: Record<string, string>) {
    const url = new URL(path, apiUrl);
    for (const [name, value] of Object.entries(searchParams ?? {})) {
      url.searchParams.set(name, value);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
      return await fetch(url, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }

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

    refreshRequest = post('auth/refresh', { app: options.auth.app })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) saveProfile();
          throw new Error(`刷新会话失败：HTTP ${response.status}`);
        }
        saveProfile(parseAccessToken(await response.text()));
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
      const response = await post('auth/logout');
      if (!response.ok)
        throw new Error(`退出登录失败：HTTP ${response.status}`);
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
  };
}
