import vue from '@vitejs/plugin-vue';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const envDirectory = fileURLToPath(new URL('.', import.meta.url));
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

function readGitValue(args: string[]) {
  return execFileSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
  }).trim();
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDirectory, 'VITE_');
  const isDevelopment = mode === 'development';
  const commitSha = isDevelopment
    ? readGitValue(['rev-parse', 'HEAD'])
    : (env.VITE_COMMIT_SHA || 'unknown');
  const buildTime = isDevelopment
    ? readGitValue(['show', '-s', '--format=%cI', 'HEAD'])
    : (env.VITE_BUILD_TIME || new Date().toISOString());
  const apiMode = env.VITE_API_MODE;
  const apiUrl =
    apiMode === 'native'
      ? 'http://localhost:8080'
      : apiMode === 'local'
        ? 'http://localhost:3000'
        : 'https://auth.novelia.cc';

  return {
    base: '/admin/',
    define: {
      __BUILD_TIME__: JSON.stringify(buildTime),
      __COMMIT_SHA__: JSON.stringify(commitSha),
    },
    plugins: [vue()],
    server: {
      port: 5174,
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
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
