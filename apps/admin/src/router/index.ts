import { createRouter, createWebHistory } from 'vue-router';

import { AdminLoginView } from '@novelia/admin-kit';

import LogsView from '@/views/LogsView.vue';
import OverviewView from '@/views/OverviewView.vue';
import SettingsView from '@/views/SettingsView.vue';
import UsersView from '@/views/UsersView.vue';

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
          path: 'logs',
          name: 'logs',
          component: LogsView,
          meta: { title: '操作记录' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsView,
          meta: { title: '系统设置' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'overview' } },
  ],
});

export default router;
