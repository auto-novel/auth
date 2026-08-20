import postcssCascadeLayers from '@csstools/postcss-cascade-layers';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, loadEnv, type UserConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname);
  const apiMode = env.VITE_API_MODE;
  const apiUrl = (() => {
    if (apiMode === 'remote') {
      return 'https://n.novelia.cc';
    } else if (apiMode === 'local') {
      return 'http://localhost:3000';
    } else if (apiMode === 'native') {
      return 'http://localhost:8080';
    }
    return 'https://n.novelia.cc';
  })();

  const config: UserConfig = {
    build: {
      target: ['es2015'],
    },
    server: {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite:
            apiMode === 'native'
              ? (path: string) => path.replace(/^\/api/, '')
              : undefined,
        },
      },
    },
    css: {
      // postcss-cascade-layers 在开发模式下会导致样式加载异常，因此仅在生产模式下启用
      postcss:
        mode === 'production'
          ? { plugins: [postcssCascadeLayers()] }
          : undefined,
    },
    plugins: [
      tailwindcss(),
      vue(),
      createHtmlPlugin({
        minify: { minifyJS: true },
      }),
      AutoImport({
        dts: 'src/auto-imports.d.ts',
        imports: ['vue', 'vue-router', 'pinia'],
      }),
      Components({
        dts: 'src/components.d.ts',
        dirs: ['src/components', 'src/ui'],
      }),
    ],
  };

  return config;
});
