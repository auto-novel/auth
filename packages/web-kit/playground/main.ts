import { createWebKit, MyStrikeListView } from '@novelia/web-kit';
import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';

import App from './App.vue';
import HomeView from './HomeView.vue';
import './style.css';

const webKit = createWebKit({
  auth: { app: 'playground', url: '/auth' },
  brand: 'Playground',
  repository: {
    url: 'https://github.com/auto-novel/auth',
    buildTime: __BUILD_TIME__,
    commitSha: __COMMIT_SHA__,
  },
});

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/theme',
      name: 'theme',
      component: () => import('./ThemeView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('./ProfileView.vue'),
    },
    {
      path: '/strikes',
      name: 'strikes',
      component: MyStrikeListView,
    },
  ],
});

createApp(App).use(webKit).use(router).mount('#app');
