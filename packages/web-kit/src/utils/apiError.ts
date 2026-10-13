import { isHTTPError, isTimeoutError } from 'ky';

const MAX_ERROR_MESSAGE_LENGTH = 200;

/** 不展示 HTML 错误页，并限制 toast 文案长度。 */
function normalizeErrorMessage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const message = value.trim();
  if (!message || /<!doctype\b|<!--|<\/?[a-z][^>]*>/i.test(message)) {
    return undefined;
  }
  return message.length > MAX_ERROR_MESSAGE_LENGTH
    ? `${message.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1).trimEnd()}…`
    : message;
}

/** 从已解析的数据或正文字符串中提取可展示的错误文案。 */
export function getApiErrorDetail(data: unknown): string | undefined {
  try {
    if (typeof data === 'string') {
      const body = data;
      try {
        data = JSON.parse(body);
      } catch {
        return normalizeErrorMessage(body);
      }
    }
    if (typeof data === 'string') return normalizeErrorMessage(data);
    if (data && typeof data === 'object') {
      for (const key of ['message', 'error', 'detail']) {
        const message = normalizeErrorMessage(
          (data as Record<string, unknown>)[key],
        );
        if (message) return message;
      }
    }
  } catch {
    // Malformed data (including throwing getters) must not escape the helper.
  }
}

/** 统一提取业务文案及 HTTP、超时兜底，不读取响应流或改写原异常。 */
export function getApiErrorMessage(reason: unknown, fallback: string): string {
  const fallbackMessage = normalizeErrorMessage(fallback) ?? '请求失败';
  try {
    if (reason && typeof reason === 'object') {
      const detail = getApiErrorDetail(
        'data' in reason ? reason.data : undefined,
      );
      if (detail) return detail;
    }
    if (isHTTPError(reason)) return `请求失败[${reason.response.status}]`;
    if (isTimeoutError(reason)) return '请求超时，请稍后再试';
    return reason instanceof Error
      ? normalizeErrorMessage(reason.message) ?? fallbackMessage
      : fallbackMessage;
  } catch {
    // Error extraction must never replace the original rejection reason.
    return fallbackMessage;
  }
}
