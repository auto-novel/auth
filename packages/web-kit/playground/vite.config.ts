import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// web-kit 的本地调试入口：以源码方式加载 kit，改组件/CSS 立即热更新。
export default defineConfig({
  root: import.meta.dirname,
  plugins: [tailwindcss(), vue()],
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_SHA__: JSON.stringify(''),
  },
  server: {
    port: 5175,
    strictPort: true,
  },
});
