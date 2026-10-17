export interface UploadProgressEvent {
  loaded: number;
  /** 请求总字节数，未知时为 null。 */
  total: number | null;
}

type RequestOptions = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  /** 毫秒；默认 0，不限制时间。 */
  timeout?: number;
  signal?: AbortSignal;
};

export type UploadRequestOptions = RequestOptions &
  (
    | {
        /** 默认 FormData 上传；不要手动设置 multipart Content-Type。 */
        bodyType?: 'form-data';
        /** 文件字段名，默认 file。 */
        fieldName?: string;
      }
    | {
        /** 直接发送文件，可用于预签名 PUT 上传。 */
        bodyType: 'file';
        fieldName?: never;
      }
  );

export type UploadFileOptions = UploadRequestOptions & {
  onProgress?: (event: UploadProgressEvent) => void;
};

export class UploadError extends Error {
  readonly kind: 'http' | 'network' | 'timeout';
  /** 仅 HTTP 错误包含响应，可读取 status、headers 和响应体。 */
  readonly response?: Response;

  constructor(kind: UploadError['kind'], response?: Response) {
    super(
      kind === 'http'
        ? `上传失败：HTTP ${response?.status}`
        : kind === 'timeout'
          ? '上传超时'
          : '上传网络错误',
    );
    this.name = 'UploadError';
    this.kind = kind;
    this.response = response;
  }
}

function toResponse(xhr: XMLHttpRequest): Response {
  const headers = new Headers();
  for (const line of xhr.getAllResponseHeaders().split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator > 0) {
      headers.append(
        line.slice(0, separator).trim(),
        line.slice(separator + 1).trim(),
      );
    }
  }
  // Response 不允许这些状态携带响应体。
  const body = [204, 205, 304].includes(xhr.status) ? null : xhr.response;
  return new Response(body, {
    status: xhr.status,
    statusText: xhr.statusText,
    headers,
  });
}

/** 只负责 XHR 传输；2xx 返回标准 Response，其余情况拒绝，不自动重试。 */
export function uploadFile(
  file: File,
  options: UploadFileOptions,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const { signal } = options;
    let xhr: XMLHttpRequest | undefined;
    let settled = false;

    function cleanup() {
      signal?.removeEventListener('abort', abort);
      if (!xhr) return;
      xhr.onload = null;
      xhr.onerror = null;
      xhr.ontimeout = null;
      xhr.onabort = null;
      xhr.upload.onprogress = null;
    }

    function fail(error: unknown) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    }

    function abort() {
      if (settled) return;
      // 先解绑事件；某些 XHR 状态下 abort() 不触发 onabort。
      fail(new DOMException('上传已取消', 'AbortError'));
      xhr?.abort();
    }

    if (signal?.aborted) {
      abort();
      return;
    }

    try {
      xhr = new XMLHttpRequest();
      const request = xhr;
      if (options.onProgress) {
        request.upload.onprogress = (event) => {
          if (settled) return;
          try {
            const total =
              event.lengthComputable &&
              Number.isFinite(event.total) &&
              event.total > 0
                ? event.total
                : null;
            const loaded = Number.isFinite(event.loaded)
              ? Math.max(0, event.loaded)
              : 0;
            options.onProgress!({
              loaded: total === null ? loaded : Math.min(loaded, total),
              total,
            });
          } catch (error) {
            fail(error);
            request.abort();
          }
        };
      }
      request.onload = () => {
        if (settled) return;
        try {
          if (request.status === 0) {
            fail(new UploadError('network'));
            return;
          }
          const response = toResponse(request);
          if (!response.ok) {
            fail(new UploadError('http', response));
            return;
          }
          settled = true;
          cleanup();
          resolve(response);
        } catch (error) {
          fail(error);
        }
      };
      request.onerror = () => fail(new UploadError('network'));
      request.ontimeout = () => fail(new UploadError('timeout'));
      request.onabort = () =>
        fail(new DOMException('上传已取消', 'AbortError'));
      request.open(options.method ?? 'POST', options.url, true);
      request.withCredentials = options.withCredentials ?? false;
      request.timeout = options.timeout ?? 0;
      // 固定以 Blob 接收，保留二进制内容，由 Response 提供 text/json/blob 读取。
      request.responseType = 'blob';
      for (const [name, value] of Object.entries(options.headers ?? {})) {
        request.setRequestHeader(name, value);
      }
      let body: File | FormData = file;
      if (options.bodyType !== 'file') {
        body = new FormData();
        body.append(options.fieldName ?? 'file', file, file.name);
      }
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort();
      else request.send(body);
    } catch (error) {
      fail(error);
    }
  });
}
