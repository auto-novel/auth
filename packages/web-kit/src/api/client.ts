import ky, { isHTTPError, isTimeoutError, type KyInstance } from 'ky';

import { getApiErrorDetail } from '../utils/apiError';

export interface AccessTokenProvider {
  get(): string | undefined;
  ready?(): Promise<void>;
  refresh(): Promise<string | undefined>;
}

const REQUEST_TIMEOUT = 5000;
const SESSION_EXPIRED_MESSAGE = '登录状态已失效，请重新登录';
const INVALID_ACCESS_TOKEN_CHALLENGE = 'Bearer error="invalid_token"';

export interface ApiClientOptions {
  timeout?: number | false;
}

export function createApiClient(
  baseUrl: string,
  options: ApiClientOptions = {},
) {
  if (!baseUrl.trim()) throw new Error('必须配置 baseUrl');

  return ky.create({
    prefix: baseUrl,
    timeout: options.timeout ?? REQUEST_TIMEOUT,
    retry: { limit: 0 },
    hooks: {
      beforeError: [
        ({ error }) => {
          if (isHTTPError(error)) {
            error.message =
              getApiErrorDetail(error.data) ??
              `请求失败[${error.response.status}]`;
          } else if (isTimeoutError(error)) {
            error.message = '请求超时，请稍后再试';
          }
          return error;
        },
      ],
    },
  });
}

export function createAuthAwareApiClientInner(
  client: KyInstance,
  accessToken: AccessTokenProvider,
) {
  return client.extend({
    retry: {
      limit: 1,
      methods: ['get', 'head', 'post', 'put', 'patch', 'delete', 'options'],
      delay: () => 0,
      shouldRetry: ({ error }) =>
        isHTTPError(error) &&
        error.response.status === 401 &&
        error.request.headers.has('Authorization') &&
        error.response.headers
          .get('WWW-Authenticate')
          ?.includes(INVALID_ACCESS_TOKEN_CHALLENGE) === true,
    },
    hooks: {
      beforeRequest: [
        async ({ request }) => {
          await accessToken.ready?.();
          const token = accessToken.get();
          if (token) request.headers.set('Authorization', `Bearer ${token}`);
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

export function createAuthAwareApiClient(
  baseUrl: string,
  options: ApiClientOptions,
  provider: AccessTokenProvider,
) {
  const client = createApiClient(baseUrl, options);
  return createAuthAwareApiClientInner(client, provider);
}
