import ky from 'ky';

export const AUTH_APP = 'auth';

export const AUTH_URL = 'https://auth.novelia.cc';
export const AUTH_ORIGIN = new URL(AUTH_URL).origin;

const client = ky.create({
  prefix: new URL('/api/v1/', window.location.origin).toString(),
  credentials: 'include',
  timeout: 5000,
});

export const AuthApi = {
  refresh: () =>
    client.post('auth/refresh', { searchParams: { app: AUTH_APP } }).text(),
  logout: () => client.post('auth/logout').text(),
};
