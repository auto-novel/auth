export interface AuthStorageOptions {
  key: string;
  target: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

export interface UserProfile {
  token: string;
  username: string;
  role: string;
  createdAt: number;
  issuedAt: number;
  expiredAt: number;
}

interface AccessTokenClaims {
  sub: string;
  role: string;
  crat: number;
  iat: number;
  exp: number;
}

export function parseAccessToken(token: string): UserProfile {
  const encodedPayload = token.split('.')[1];
  if (!encodedPayload) throw new Error('访问令牌格式无效');

  const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
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

export function createAuthStorage(options?: AuthStorageOptions) {
  function clear() {
    if (!options) return;
    try {
      options.target.removeItem(options.key);
    } catch {
      // Storage may be unavailable or blocked by the browser.
    }
  }

  function getUserProfile() {
    if (!options) return;

    try {
      const stored = options.target.getItem(options.key);
      if (!stored) return;

      const storedProfile = JSON.parse(stored) as { token?: unknown };
      if (typeof storedProfile.token !== 'string') {
        throw new Error('存储的访问令牌无效');
      }

      const profile = parseAccessToken(storedProfile.token);
      if (Date.now() >= profile.expiredAt * 1000) {
        clear();
        return;
      }

      return profile;
    } catch {
      clear();
      return;
    }
  }

  function setUserProfile(profile: UserProfile) {
    if (!options) return;
    try {
      options.target.setItem(options.key, JSON.stringify(profile));
    } catch {
      // A successful refresh remains usable even if persistence fails.
    }
  }

  return { getUserProfile, setUserProfile, clear };
}
