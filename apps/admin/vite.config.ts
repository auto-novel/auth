import vue from '@vitejs/plugin-vue';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type UserConfig } from 'vite';

const envDirectory = fileURLToPath(new URL('.', import.meta.url));
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

function readGitValue(args: string[]) {
  return execFileSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
  }).trim();
}

function setupAuthProxy(config: UserConfig) {
  const authUrl = 'https://auth.novelia.cc';
  const proxy = config.server!.proxy!;

  proxy['/auth-proxy/api'] = {
    target: authUrl,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/auth-proxy/, ''),
  };

  proxy['/auth-proxy/assets'] = {
    target: authUrl,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/auth-proxy\/assets/, '/assets'),
  };

  proxy['/auth-proxy'] = {
    target: authUrl,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/auth-proxy/, ''),
    selfHandleResponse: true,
    headers: {
      'accept-encoding': 'identity',
    },
    configure(proxyServer) {
      proxyServer.on('proxyRes', (proxyResponse, _request, response) => {
        const chunks: Buffer[] = [];
        proxyResponse.on('data', (chunk: Buffer) => chunks.push(chunk));
        proxyResponse.on('end', () => {
          const body = Buffer.concat(chunks)
            .toString()
            .replaceAll('/assets', '/auth-proxy/assets');

          response.statusCode = proxyResponse.statusCode ?? 200;
          response.statusMessage = proxyResponse.statusMessage ?? '';
          for (const [key, value] of Object.entries(proxyResponse.headers)) {
            if (value !== undefined) response.setHeader(key, value);
          }
          response.removeHeader('content-length');
          response.end(body);
        });
      });
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, envDirectory, 'VITE_');
  const isServe = command === 'serve';
  const authUrl = isServe ? '/auth-proxy/' : 'https://auth.novelia.cc';
  const commitSha = isServe
    ? readGitValue(['rev-parse', 'HEAD'])
    : env.VITE_COMMIT_SHA || 'unknown';
  const buildTime = isServe
    ? readGitValue(['show', '-s', '--format=%cI', 'HEAD'])
    : env.VITE_BUILD_TIME || new Date().toISOString();
  const apiMode = env.VITE_API_MODE;
  const apiUrl =
    apiMode === 'native'
      ? 'http://localhost:8080'
      : apiMode === 'local'
        ? 'http://localhost:3000'
        : 'https://auth.novelia.cc';

  const config: UserConfig = {
    base: '/admin/',
    define: {
      __AUTH_URL__: JSON.stringify(authUrl),
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

  if (isServe) setupAuthProxy(config);

  return config;
});
