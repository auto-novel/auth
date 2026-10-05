import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// admin-kit 的本地调试入口：以源码方式加载 kit，改组件/样式立即热更新。
export default defineConfig({
  root: import.meta.dirname,
  plugins: [vue()],
  define: {
    // 内置登录页会拿这个地址拼 iframe 的登录链接。
    __AUTH_URL__: JSON.stringify('https://auth.novelia.cc'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_SHA__: JSON.stringify(''),
  },
  server: {
    port: 5176,
    strictPort: true,
  },
});
