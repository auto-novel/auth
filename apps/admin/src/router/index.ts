import { createRouter, createWebHistory } from 'vue-router';

import LogsView from '@/views/LogsView.vue';
import OverviewView from '@/views/OverviewView.vue';
import SettingsView from '@/views/SettingsView.vue';
import UsersView from '@/views/UsersView.vue';

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    { path: '/', redirect: '/overview' },
    {
      path: '/overview',
      component: OverviewView,
      meta: { title: '概览' },
    },
    {
      path: '/users',
      component: UsersView,
      meta: { title: '用户管理' },
    },
    {
      path: '/logs',
      component: LogsView,
      meta: { title: '操作记录' },
    },
    {
      path: '/settings',
      component: SettingsView,
      meta: { title: '系统设置' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/overview' },
  ],
});

export default router;
