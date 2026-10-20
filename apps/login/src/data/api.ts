async function post(url: string, body: object) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('/api/v1/auth/' + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      throw `[${response.status}] ${text || response.statusText}`;
    }
    return text;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw '请求超时，请稍后再试';
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export type OtpType = 'verify' | 'reset_password';

export const Api = {
  register: (body: {
    app: string;
    username: string;
    password: string;
    email: string;
    otp: string;
  }) => post('register', body),
  requestOtp: (body: {
    email: string;
    type: OtpType;
    turnstileToken: string;
  }) => post('otp/request', body),
  resetPassword: (body: { email: string; password: string; otp: string }) =>
    post('password/reset', body),
};
