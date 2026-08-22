import { createRouter, createWebHistory } from 'vue-router';

import { useAuthSession } from '@/auth/session';
import AdminLayout from '@/layouts/AdminLayout.vue';
import LoginView from '@/views/LoginView.vue';
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
      component: LoginView,
      meta: { title: '登录', guestOnly: true },
    },
    {
      path: '/',
      component: AdminLayout,
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

router.beforeEach(async (to) => {
  const authSession = useAuthSession();
  await authSession.initialize();

  if (to.meta.requiresAuth && !authSession.isSignedIn.value) {
    return {
      name: 'login',
      query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
    };
  }

  if (to.meta.guestOnly && authSession.isSignedIn.value) {
    return { name: 'overview' };
  }
});

export default router;
