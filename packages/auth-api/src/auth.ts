import type { ApiClient } from './client';

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

export interface RegisterRequest {
  app: string;
  username: string;
  password: string;
  email: string;
  otp: string;
}

export interface LoginRequest {
  app: string;
  username: string;
  password: string;
}

export type OtpType = 'verify' | 'reset_password';

export interface RequestOtpRequest {
  email: string;
  type: OtpType;
}

export interface ResetPasswordRequest {
  email: string;
  password: string;
  otp: string;
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

export function createAuthEndpoints(client: ApiClient) {
  return {
    register: (request: RegisterRequest) =>
      client.post('auth/register', request).text(),
    login: (request: LoginRequest) => client.post('auth/login', request).text(),
    requestOtp: (request: RequestOtpRequest) =>
      client.post('auth/otp/request', request).text(),
    resetPassword: (request: ResetPasswordRequest) =>
      client.post('auth/password/reset', request).text(),
    refresh: (app: string) => {
      const searchParams = new URLSearchParams({ app });
      return client
        .post(`auth/refresh?${searchParams}`, undefined, {
          credentials: 'include',
        })
        .text();
    },
    async logout() {
      await client
        .post('auth/logout', undefined, {
          credentials: 'include',
        })
        .void();
    },
  };
}
