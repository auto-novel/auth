export interface ApiRequestOptions {
  baseUrl: string;
  timeout?: number;
  fetch?: typeof globalThis.fetch;
}

export interface AccessTokenSession {
  getAccessToken(): string | undefined;
  refreshAccessToken(): Promise<string | undefined>;
}

export interface ApiClientOptions extends ApiRequestOptions {
  session?: AccessTokenSession;
}

interface ApiCallOptions extends RequestInit {
  authenticated?: boolean;
  timeout?: number;
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

function resolveUrl(path: string, baseUrl: string) {
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

export function createApiClient(options: ApiClientOptions) {
  if (!options.baseUrl.trim()) throw new Error('必须配置 baseUrl');

  const fetcher = options.fetch ?? globalThis.fetch;

  async function request(path: string, callOptions: ApiCallOptions = {}) {
    const {
      authenticated = false,
      timeout = options.timeout,
      ...init
    } = callOptions;
    const url = resolveUrl(path, options.baseUrl);

    let response: Response;
    if (authenticated) {
      if (!options.session) {
        throw new Error('调用受保护接口前必须配置 session');
      }
      response = await fetchWithToken(
        options.session,
        fetcher,
        url,
        init,
        timeout,
      );
    } else {
      response = await fetchWithTimeout(fetcher, url, init, timeout);
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

  async function text(path: string, callOptions?: ApiCallOptions) {
    return (await request(path, callOptions)).text();
  }

  async function json<T>(path: string, callOptions?: ApiCallOptions) {
    return (await request(path, callOptions)).json() as Promise<T>;
  }

  return { request, text, json };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function jsonRequest(
  body: unknown,
): Pick<RequestInit, 'body' | 'headers'> {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
