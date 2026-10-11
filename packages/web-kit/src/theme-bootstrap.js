/** 独立的首屏引导脚本，仅供构建期注入 <head>，不依赖 kit 运行时。 */
export const themeBootstrapScript = `(() => {
  let preference = 'system';
  try {
    const value = JSON.parse(localStorage.getItem('web-kit:theme:v1'));
    if (value === 'light' || value === 'dark' || value === 'system') {
      preference = value;
    }
  } catch {
    // 无效 JSON 或存储不可用时，和 kit 运行时一样跟随系统。
  }

  const theme = preference === 'system'
    ? typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    : preference;

  document.documentElement.dataset.theme = theme;
})();`;
