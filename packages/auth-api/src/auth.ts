import {
  jsonRequest,
  requestText,
  requestVoid,
  type ApiRequestOptions,
} from './client';

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

export function register(
  request: RegisterRequest,
  options?: ApiRequestOptions,
) {
  return requestText('auth/register', {
    timeout: 5000,
    ...options,
    method: 'POST',
    ...jsonRequest(request),
  });
}

export function login(request: LoginRequest, options?: ApiRequestOptions) {
  return requestText('auth/login', {
    timeout: 5000,
    ...options,
    method: 'POST',
    ...jsonRequest(request),
  });
}

export function requestOtp(
  request: RequestOtpRequest,
  options?: ApiRequestOptions,
) {
  return requestText('auth/otp/request', {
    timeout: 5000,
    ...options,
    method: 'POST',
    ...jsonRequest(request),
  });
}

export function resetPassword(
  request: ResetPasswordRequest,
  options?: ApiRequestOptions,
) {
  return requestText('auth/password/reset', {
    timeout: 5000,
    ...options,
    method: 'POST',
    ...jsonRequest(request),
  });
}

export function refresh(app: string, options?: ApiRequestOptions) {
  const searchParams = new URLSearchParams({ app });
  return requestText(`auth/refresh?${searchParams}`, {
    timeout: 5000,
    ...options,
    method: 'POST',
    credentials: 'include',
  });
}

export function logout(options?: ApiRequestOptions) {
  return requestVoid('auth/logout', {
    timeout: 5000,
    ...options,
    method: 'POST',
    credentials: 'include',
  });
}
