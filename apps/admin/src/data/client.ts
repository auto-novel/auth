import type { AuthSession } from '@novelia/admin-kit';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class SessionExpiredError extends ApiError {
  constructor() {
    super('登录状态已失效，请重新登录', 401);
    this.name = 'SessionExpiredError';
  }
}

async function requestWithToken(
  token: string,
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export async function adminFetch(
  session: AuthSession,
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  let token = session.profile.value?.token;
  if (!token) throw new SessionExpiredError();

  let response = await requestWithToken(token, input, init);
  if (response.status === 401) {
    try {
      await session.refresh();
    } catch {
      throw new SessionExpiredError();
    }
    token = session.profile.value?.token;
    if (!token) throw new SessionExpiredError();
    response = await requestWithToken(token, input, init);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(
      message || `请求失败（${response.status}）`,
      response.status,
    );
  }

  return response;
}
