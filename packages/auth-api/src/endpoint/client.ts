import ky, { isHTTPError, isTimeoutError } from 'ky';

export interface AccessTokenProvider {
  get(): string | undefined;
  refresh(): Promise<string | undefined>;
}

const REQUEST_TIMEOUT = 5000;
const SESSION_EXPIRED_MESSAGE = '登录状态已失效，请重新登录';

export function createApiClient(baseUrl: string) {
  if (!baseUrl.trim()) throw new Error('必须配置 baseUrl');

  return ky.create({
    prefix: baseUrl,
    timeout: REQUEST_TIMEOUT,
    retry: { limit: 0 },
    hooks: {
      beforeError: [
        ({ error }) => {
          if (isHTTPError(error)) {
            const status = error.response.status;
            let detail: string | undefined;
            if (typeof error.data === 'string') detail = error.data.trim();
            else if (error.data !== undefined) {
              try {
                detail = JSON.stringify(error.data);
              } catch {
                // Fall back to the status-based message below.
              }
            }
            error.message = detail
              ? `请求失败[${status}] ${detail}`
              : `请求失败[${status}]`;
          } else if (isTimeoutError(error)) {
            error.message = '请求超时，请稍后再试';
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
          if (!token) throw new Error(SESSION_EXPIRED_MESSAGE);
          request.headers.set('Authorization', `Bearer ${token}`);
        },
      ],
      beforeRetry: [
        async ({ request }) => {
          const token = await accessToken.refresh();
          if (!token) throw new Error(SESSION_EXPIRED_MESSAGE);
          request.headers.set('Authorization', `Bearer ${token}`);
        },
      ],
    },
  });
}
