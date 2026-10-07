/** 登录 iframe 的地址和消息协议；刷新始终复用 kit 会话。 */
export function createLoginBridge(
  authUrl: URL,
  app: string,
  refresh: () => Promise<string | undefined>,
) {
  return {
    createLoginUrl(theme: 'dark' | 'light') {
      const url = new URL(authUrl);
      url.searchParams.set('app', app);
      url.searchParams.set('theme', theme);
      return url.toString();
    },
    /** Returns undefined for unrelated messages, or a login completion promise. */
    handleLoginMessage(
      event: MessageEvent<unknown>,
      source: Window | null | undefined,
    ): Promise<void> | undefined {
      if (
        !source ||
        event.origin !== authUrl.origin ||
        event.source !== source ||
        typeof event.data !== 'object' ||
        event.data === null ||
        !('type' in event.data) ||
        event.data.type !== 'login_success'
      ) {
        return;
      }

      return refresh().then((token) => {
        if (!token) throw new Error('登录状态同步失败，请重试');
      });
    },
  };
}
