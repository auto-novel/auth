import { createApp } from 'vue';
import App from './App.vue';

import { createAdminAuthGuard, createAdminKit } from '@novelia/admin-kit';

import router from './router';

const adminKit = createAdminKit({
  auth: {
    app: 'auth',
    url: __AUTH_URL__,
  },
  brand: 'Auth',
  repository: {
    url: 'https://github.com/auto-novel/auth',
    buildTime: __BUILD_TIME__,
    commitSha: __COMMIT_SHA__,
  },
});

router.beforeEach(createAdminAuthGuard(adminKit));

createApp(App).use(adminKit).use(router).mount('#app');
