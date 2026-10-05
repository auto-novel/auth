import { createAdminAuthGuard, createAdminKit } from '@novelia/admin-kit';
import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import './style.css';

const adminKit = createAdminKit({
  auth: { app: 'playground', url: __AUTH_URL__ },
  brand: 'Playground',
  repository: {
    url: 'https://github.com/auto-novel/auth',
    buildTime: __BUILD_TIME__,
    commitSha: __COMMIT_SHA__,
  },
});

router.beforeEach(createAdminAuthGuard(adminKit));

// 先装 kit 再装 router，保证首个路由守卫拿到已启动的会话。
createApp(App).use(adminKit).use(router).mount('#app');
