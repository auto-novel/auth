export interface ApiRequestOptions {
  baseUrl: string;
  timeout?: number;
  fetch?: typeof globalThis.fetch;
}

export interface AccessTokenSession {
  getAccessToken(): string | undefined;
  refreshAccessToken(): Promise<string | undefined>;
}

interface ApiCallOptions extends RequestInit {
  timeout?: number;
}

type ApiMethodOptions = Omit<ApiCallOptions, 'body' | 'method'>;

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

export function createApiClient(
  options: ApiRequestOptions & { session?: AccessTokenSession },
) {
  if (!options.baseUrl.trim()) throw new Error('必须配置 baseUrl');

  const fetcher = options.fetch ?? globalThis.fetch;

  async function execute(path: string, callOptions: ApiCallOptions = {}) {
    const { timeout = options.timeout, ...init } = callOptions;
    const url = resolveUrl(path, options.baseUrl);

    const response = options.session
      ? await fetchWithToken(options.session, fetcher, url, init, timeout)
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

  function result(response: Promise<Response>) {
    return {
      async text() {
        return (await response).text();
      },
      async json<T>() {
        return (await response).json() as Promise<T>;
      },
      async void() {
        await response;
      },
    };
  }

  function request(path: string, callOptions?: ApiCallOptions) {
    return result(execute(path, callOptions));
  }

  function get(path: string, callOptions?: ApiMethodOptions) {
    return request(path, { ...callOptions, method: 'GET' });
  }

  function post(path: string, body?: unknown, callOptions?: ApiMethodOptions) {
    const headers = new Headers(callOptions?.headers);
    if (body !== undefined) headers.set('Content-Type', 'application/json');

    return request(path, {
      ...callOptions,
      method: 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  return { get, post, request };
}

export type ApiClient = ReturnType<typeof createApiClient>;
