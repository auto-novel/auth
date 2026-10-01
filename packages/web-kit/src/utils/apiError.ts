export async function getApiErrorMessage(
  reason: unknown,
  fallback: string,
): Promise<string> {
  if (reason && typeof reason === 'object' && 'response' in reason) {
    const response = (reason as { response?: Response }).response;
    if (response) {
      try {
        const body = await response.text();
        if (body) {
          try {
            const value = JSON.parse(body) as unknown;
            if (typeof value === 'string') return value;
            if (value && typeof value === 'object') {
              for (const key of ['message', 'error', 'detail']) {
                const message = (value as Record<string, unknown>)[key];
                if (typeof message === 'string' && message) return message;
              }
            }
          } catch {
            return body;
          }
        }
      } catch {
        // Use the fallback below when the response body is unavailable.
      }
    }
  }
  return reason instanceof Error ? reason.message : fallback;
}
