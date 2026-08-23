import { createRouter, createWebHistory } from 'vue-router';

import { AdminLoginView } from '@novelia/admin-kit';

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
        { path: 'logs', redirect: { name: 'events' } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'overview' } },
  ],
});

export default router;
