import { createRouter, createWebHistory } from 'vue-router';

import { AdminLoginView } from '@novelia/admin-kit';

const APP_TITLE = '认证服务管理后台';

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: AdminLoginView,
      meta: { title: '登录', guestOnly: true },
    },
    {
      path: '/',
      redirect: { name: 'overview' },
      meta: { requiresAuth: true },
      children: [
        {
          path: 'overview',
          name: 'overview',
          component: () => import('@/views/overview/OverviewView.vue'),
          meta: { title: '概览' },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/users/UsersView.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'events',
          name: 'events',
          component: () => import('@/views/events/EventsView.vue'),
          meta: { title: '事件记录' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/settings/SettingsView.vue'),
          meta: { title: '系统设置' },
        },
        { path: 'logs', redirect: { name: 'events' } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'overview' } },
  ],
});

router.afterEach((to) => {
  const pageTitle = to.meta.title;
  document.title = pageTitle
    ? `${String(pageTitle)} | ${APP_TITLE}`
    : APP_TITLE;
});

export default router;
