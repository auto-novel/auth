import { createRouter, createWebHistory } from 'vue-router';

import { AdminLoginView } from '@novelia/admin-kit';

import EventsView from '@/views/events/EventsView.vue';
import OverviewView from '@/views/overview/OverviewView.vue';
import SettingsView from '@/views/settings/SettingsView.vue';
import StrikesView from '@/views/strikes/StrikesView.vue';
import UsersView from '@/views/users/UsersView.vue';

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
          component: OverviewView,
          meta: { title: '概览' },
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: { title: '用户管理' },
        },
        {
          path: 'strikes',
          name: 'strikes',
          component: StrikesView,
          meta: { title: '处罚管理' },
        },
        {
          path: 'events',
          name: 'events',
          component: EventsView,
          meta: { title: '事件记录' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsView,
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
