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
      path: '/components',
      name: 'components',
      component: () => import('./ComponentsView.vue'),
    },
    {
      path: '/components/toast',
      name: 'components-toast',
      component: () => import('./components/ToastView.vue'),
    },
    {
      path: '/components/drawer',
      name: 'components-drawer',
      component: () => import('./components/DrawerView.vue'),
    },
    {
      path: '/components/select',
      name: 'components-select',
      component: () => import('./components/SelectView.vue'),
    },
    {
      path: '/components/action-menu',
      name: 'components-action-menu',
      component: () => import('./components/ActionMenuView.vue'),
    },
    {
      path: '/components/pagination',
      name: 'components-pagination',
      component: () => import('./components/PaginationView.vue'),
    },
    {
      path: '/components/drop-zone',
      name: 'components-drop-zone',
      component: () => import('./components/DropZoneView.vue'),
    },
    {
      path: '/components/async-content',
      name: 'components-async-content',
      component: () => import('./components/AsyncContentView.vue'),
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
