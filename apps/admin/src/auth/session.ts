import { HTTPError } from 'ky';
import { computed, readonly, ref } from 'vue';

import { AuthApi } from './api';
import type { UserRole } from './roles';

interface AccessTokenClaims {
  sub: string;
  role: UserRole;
  crat: number;
  iat: number;
  exp: number;
}

export interface UserProfile {
  token: string;
  username: string;
  role: UserRole;
  createdAt: number;
  issuedAt: number;
  expiredAt: number;
}

const STORAGE_KEY = 'auth-admin-session';
const profile = ref<UserProfile>();
const initialized = ref(false);
let refreshRequest: Promise<void> | undefined;
let initializeRequest: Promise<void> | undefined;

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

function saveProfile(nextProfile?: UserProfile) {
  profile.value = nextProfile;
  if (nextProfile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function restoreProfile() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const storedProfile = JSON.parse(stored) as UserProfile;
    const restored = parseAccessToken(storedProfile.token);
    if (Date.now() >= restored.expiredAt * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    profile.value = restored;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

restoreProfile();

async function refresh() {
  if (refreshRequest) return refreshRequest;

  refreshRequest = AuthApi.refresh()
    .then((token) => saveProfile(parseAccessToken(token)))
    .catch((error: unknown) => {
      if (error instanceof HTTPError && error.response.status === 401) {
        saveProfile();
      }
      throw error;
    })
    .finally(() => {
      refreshRequest = undefined;
    });
  return refreshRequest;
}

async function initialize() {
  if (initialized.value) return;
  if (initializeRequest) return initializeRequest;

  initializeRequest = refresh()
    .catch(() => {
      // An anonymous visit is an expected state; the login route remains available.
    })
    .finally(() => {
      initialized.value = true;
      initializeRequest = undefined;
    });
  return initializeRequest;
}

async function logout() {
  saveProfile();
  try {
    await AuthApi.logout();
  } catch {
    // Local logout must still succeed if the server session already expired.
  }
}

const isSignedIn = computed(() => profile.value !== undefined);
const isAdmin = computed(() => profile.value?.role === 'admin');

void initialize();

window.setInterval(
  () => {
    const issuedAt = profile.value?.issuedAt;
    if (issuedAt && Date.now() - issuedAt * 1000 >= 60 * 60 * 1000) {
      void refresh().catch(() => undefined);
    }
  },
  15 * 60 * 1000,
);

export function useAuthSession() {
  return {
    profile: readonly(profile),
    initialized: readonly(initialized),
    isSignedIn,
    isAdmin,
    initialize,
    refresh,
    logout,
  };
}

export function getAccessToken() {
  return profile.value?.token;
}
