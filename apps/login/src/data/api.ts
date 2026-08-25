import { login, register, requestOtp, resetPassword } from '@novelia/auth-api';

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
  register: debounce(register),
  login: debounce(login),
  requestOtp: debounce(requestOtp),
  resetPassword: debounce(resetPassword),
};
