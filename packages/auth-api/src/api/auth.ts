import type { ApiClient } from '../client';

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
