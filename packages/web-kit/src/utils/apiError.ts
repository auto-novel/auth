/** 从已解析的数据或响应正文中提取可展示的错误文案。 */
export function getApiErrorDetail(data: unknown): string | undefined {
  if (typeof data === 'string') {
    const body = data;
    try {
      data = JSON.parse(body);
    } catch {
      return body.trim() || undefined;
    }
  }
  if (typeof data === 'string') return data.trim() || undefined;
  if (data && typeof data === 'object') {
    for (const key of ['message', 'error', 'detail']) {
      const message = (data as Record<string, unknown>)[key];
      if (typeof message === 'string' && message.trim()) return message.trim();
    }
  }
}

export async function getApiErrorMessage(
  reason: unknown,
  fallback: string,
): Promise<string> {
  if (reason && typeof reason === 'object') {
    const detail = getApiErrorDetail(
      'data' in reason ? reason.data : undefined,
    );
    if (detail) return detail;

    if ('response' in reason) {
      const response = (reason as { response?: Response }).response;
      if (response && !response.bodyUsed) {
        try {
          const body = await (response.clone?.() ?? response).text();
          const detail = getApiErrorDetail(body);
          if (detail) return detail;
        } catch {
          // Use the fallback below when the response body is unavailable.
        }
      }
    }
  }
  return reason instanceof Error ? reason.message : fallback;
}
