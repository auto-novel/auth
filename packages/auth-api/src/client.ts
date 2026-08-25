export const defaultApiBaseUrl = '/api/v1';

export interface ApiRequestOptions {
  baseUrl?: string;
  timeout?: number;
  fetch?: typeof globalThis.fetch;
}

export interface AccessTokenSession {
  getAccessToken(): string | undefined;
  refreshAccessToken(): Promise<string | undefined>;
}

export interface ApiFetchOptions extends ApiRequestOptions, RequestInit {
  session?: AccessTokenSession;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  override toString() {
    return this.message;
  }
}

export class SessionExpiredError extends ApiError {
  constructor() {
    super('登录状态已失效，请重新登录', 401);
    this.name = 'SessionExpiredError';
  }
}

function resolveUrl(path: string, baseUrl = defaultApiBaseUrl) {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

async function fetchWithTimeout(
  fetcher: typeof globalThis.fetch,
  input: RequestInfo | URL,
  init: RequestInit,
  timeout?: number,
) {
  if (timeout === undefined) return fetcher(input, init);

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeout);

  try {
    return await fetcher(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('请求超时，请稍后再试', 408);
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function fetchWithToken(
  session: AccessTokenSession,
  fetcher: typeof globalThis.fetch,
  input: RequestInfo | URL,
  init: RequestInit,
  timeout?: number,
) {
  let token = session.getAccessToken();
  if (!token) throw new SessionExpiredError();

  const request = (accessToken: string) => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return fetchWithTimeout(fetcher, input, { ...init, headers }, timeout);
  };

  let response = await request(token);
  if (response.status !== 401) return response;

  try {
    token = await session.refreshAccessToken();
  } catch {
    throw new SessionExpiredError();
  }
  if (!token) throw new SessionExpiredError();
  return request(token);
}

export async function apiRequest(path: string, options: ApiFetchOptions = {}) {
  const {
    baseUrl,
    timeout,
    fetch: fetcher = globalThis.fetch,
    session,
    ...init
  } = options;
  const url = resolveUrl(path, baseUrl);
  const response = session
    ? await fetchWithToken(session, fetcher, url, init, timeout)
    : await fetchWithTimeout(fetcher, url, init, timeout);

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(
      message || `请求失败（${response.status}）`,
      response.status,
    );
  }

  return response;
}

export async function requestText(path: string, options: ApiFetchOptions = {}) {
  return (await apiRequest(path, options)).text();
}

export async function requestJson<T>(
  path: string,
  options: ApiFetchOptions = {},
) {
  return (await apiRequest(path, options)).json() as Promise<T>;
}

export async function requestVoid(path: string, options: ApiFetchOptions = {}) {
  await apiRequest(path, options);
}

export function jsonRequest(
  body: unknown,
): Pick<RequestInit, 'body' | 'headers'> {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
