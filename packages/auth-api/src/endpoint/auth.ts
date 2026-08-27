import type { ApiClient } from './client';

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

export function createAuthEndpoints(client: ApiClient) {
  return {
    register(request: RegisterRequest) {
      return client.post('auth/register', request).text();
    },
    login(request: LoginRequest) {
      return client.post('auth/login', request).text();
    },
    requestOtp(request: RequestOtpRequest) {
      return client.post('auth/otp/request', request).text();
    },
    resetPassword(request: ResetPasswordRequest) {
      return client.post('auth/password/reset', request).text();
    },
    refresh(app: string) {
      return client
        .post('auth/refresh', undefined, {
          credentials: 'include',
          searchParams: { app },
        })
        .text();
    },
    logout() {
      return client
        .post('auth/logout', undefined, {
          credentials: 'include',
        })
        .void();
    },
  };
}
