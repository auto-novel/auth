import { createAuthApi } from '@novelia/auth-api';

const api = createAuthApi({ baseUrl: '/api/v1' });

function debounce<T extends (...args: any[]) => Promise<any>>(func: T) {
  const newFunc = async function (
    ...args: Parameters<T>
  ): Promise<ReturnType<T> | undefined> {
    if (newFunc.isPending) return undefined;
    newFunc.isPending = true;
    try {
      return await func(...args);
    } finally {
      newFunc.isPending = false;
    }
  };
  newFunc.isPending = false;
  return newFunc;
}

export type { OtpType } from '@novelia/auth-api';

export const Api = {
  register: debounce(api.auth.register),
  login: debounce(api.auth.login),
  requestOtp: debounce(api.auth.requestOtp),
  resetPassword: debounce(api.auth.resetPassword),
};
