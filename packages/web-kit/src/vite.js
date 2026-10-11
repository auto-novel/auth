import { themeBootstrapScript } from './theme/bootstrap.js';

/** 在首次绘制前应用主题，仅供 Vite 配置使用。 */
export function themeBootstrapPlugin() {
  return {
    name: 'web-kit-theme-bootstrap',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        {
          tag: 'script',
          children: themeBootstrapScript,
          injectTo: 'head-prepend',
        },
      ],
    },
  };
}
