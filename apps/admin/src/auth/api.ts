import ky from 'ky';

export const AUTH_APP = 'auth';

export const AUTH_URL = new URL(__AUTH_URL__, window.location.origin).toString();
export const AUTH_ORIGIN = new URL(AUTH_URL).origin;

const client = ky.create({
  prefix: new URL('api/v1/', AUTH_URL).toString(),
  credentials: 'include',
  timeout: 5000,
});

export const AuthApi = {
  refresh: () =>
    client.post('auth/refresh', { searchParams: { app: AUTH_APP } }).text(),
  logout: () => client.post('auth/logout').text(),
};
