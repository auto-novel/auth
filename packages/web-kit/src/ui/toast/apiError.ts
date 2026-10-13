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
function getApiErrorDetail(data: unknown): string | undefined {
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

export function getApiErrorMessage(reason: unknown, prefix: string): string {
  const prefixMessage = normalizeErrorMessage(prefix);
  const fallbackMessage = prefixMessage ?? '请求失败';
  const formatDetail = (detail: string) =>
    normalizeErrorMessage(
      prefixMessage ? `${prefixMessage}：${detail}` : detail,
    ) ?? fallbackMessage;

  try {
    if (reason && typeof reason === 'object') {
      const detail = getApiErrorDetail(
        'data' in reason ? reason.data : undefined,
      );
      if (detail) return formatDetail(detail);
    }
    if (isHTTPError(reason)) {
      return formatDetail(`请求失败[${reason.response.status}]`);
    }
    if (isTimeoutError(reason)) return formatDetail('请求超时，请稍后再试');
    const detail =
      reason instanceof Error
        ? normalizeErrorMessage(reason.message)
        : undefined;
    return detail ? formatDetail(detail) : fallbackMessage;
  } catch {
    // Error extraction must never replace the original rejection reason.
    return fallbackMessage;
  }
}
