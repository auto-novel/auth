import { createApp } from 'vue';
import App from './App.vue';

import { createWebKit } from '@novelia/web-kit';
import './style.css';

import { adminApiKey, createAdminApi } from './api';
import router from './router';

const webKit = createWebKit({
  auth: {
    app: 'auth',
    url: __AUTH_URL__,
    storageKey: 'auth-admin-session',
  },
  brand: 'Auth',
  themeStorageKey: 'auth-admin-theme',
  strikes: { enabled: false },
  repository: {
    url: 'https://github.com/auto-novel/auth',
    buildTime: __BUILD_TIME__,
    commitSha: __COMMIT_SHA__,
  },
});

router.beforeEach(async () => {
  await webKit.checkSignedIn();
});

createApp(App)
  .provide(
    adminApiKey,
    createAdminApi(
      webKit.createClient(
        new URL(
          'api/v1/',
          new URL(__AUTH_URL__, window.location.origin),
        ).toString(),
      ),
    ),
  )
  .use(webKit)
  .use(router)
  .mount('#app');
