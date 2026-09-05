import ky, { isHTTPError, isTimeoutError } from 'ky';

export interface AccessTokenProvider {
  get(): string | undefined;
  refresh(): Promise<string | undefined>;
}

const REQUEST_TIMEOUT = 5000;
const SESSION_EXPIRED_MESSAGE = '登录状态已失效，请重新登录';

interface ApiRequestOptions {
  baseUrl: string;
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

function apiErrorFromHttpError(error: unknown) {
  if (!isHTTPError(error)) return;

  let message: string | undefined;
  if (typeof error.data === 'string') message = error.data;
  else if (error.data !== undefined) {
    try {
      message = JSON.stringify(error.data);
    } catch {
      // Fall back to the status-based message below.
    }
  }

  return new ApiError(
    message || `请求失败（${error.response.status}）`,
    error.response.status,
  );
}

export function createApiClient(options: ApiRequestOptions) {
  if (!options.baseUrl.trim()) throw new Error('必须配置 baseUrl');

  return ky.create({
    prefix: options.baseUrl,
    timeout: REQUEST_TIMEOUT,
    retry: { limit: 0 },
    hooks: {
      beforeError: [
        ({ error }) => {
          const apiError = apiErrorFromHttpError(error);
          if (apiError) return apiError;
          if (isTimeoutError(error)) {
            return new ApiError('请求超时，请稍后再试', 408);
          }
          return error;
        },
      ],
    },
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function createAuthenticatedApiClient(
  client: ApiClient,
  accessToken: AccessTokenProvider,
) {
  return client.extend({
    retry: {
      limit: 1,
      methods: ['get', 'post'],
      delay: () => 0,
      shouldRetry: ({ error }) =>
        isHTTPError(error) && error.response.status === 401,
    },
    hooks: {
      beforeRequest: [
        ({ request }) => {
          const token = accessToken.get();
          if (!token) throw new ApiError(SESSION_EXPIRED_MESSAGE, 401);
          request.headers.set('Authorization', `Bearer ${token}`);
        },
      ],
      beforeRetry: [
        async ({ request }) => {
          const token = await accessToken.refresh();
          if (!token) throw new ApiError(SESSION_EXPIRED_MESSAGE, 401);
          request.headers.set('Authorization', `Bearer ${token}`);
        },
      ],
    },
  });
}
