async function post(url: string, body: any) {
  const controller = new AbortController();
  const signal = controller.signal;

  // 设置5秒超时
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('/api/v1/auth/' + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const message = await response.text();
      throw `[${response.status}] ${message || response.statusText}`;
    }
    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw '请求超时，请稍后再试';
    }
    throw `${error}`;
  }
}

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

export type OtpType = 'verify' | 'reset_password';

export const Api = {
  register: debounce(
    (body: {
      app: string;
      username: string;
      password: string;
      email: string;
      otp: string;
    }) => post('register', body),
  ),
  login: debounce((body: { app: string; username: string; password: string }) =>
    post('login', body),
  ),
  requestOtp: debounce((body: { email: string; type: OtpType }) =>
    post('otp/request', body),
  ),
  resetPassword: debounce(
    (body: { email: string; password: string; otp: string }) =>
      post('password/reset', body),
  ),
};
