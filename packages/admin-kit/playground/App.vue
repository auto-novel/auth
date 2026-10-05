<script setup lang="ts">
import {
  DashboardOutlined,
  DownloadOutlined,
  PeopleOutlined,
  SettingsOutlined,
} from '@vicons/material';
import {
  AdminKitApp,
  AdminKitLayout,
  type AdminKitMenuOption,
} from '@novelia/admin-kit';
import { NIcon } from 'naive-ui';
import { h, type Component } from 'vue';
import { RouterView, useRoute } from 'vue-router';

const route = useRoute();

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions: AdminKitMenuOption[] = [
  {
    label: '概览',
    key: 'overview',
    to: { name: 'overview' },
    icon: renderIcon(DashboardOutlined),
  },
  {
    label: '用户管理',
    key: 'users',
    to: { name: 'users' },
    icon: renderIcon(PeopleOutlined),
  },
  {
    label: '导出',
    key: 'export',
    icon: renderIcon(DownloadOutlined),
    onSelect: () => {
      // 动作项：只用来验证菜单回调，不做隐式导航。
      window.alert('动作项被触发');
    },
  },
  {
    label: '系统',
    key: 'system',
    icon: renderIcon(SettingsOutlined),
    children: [
      {
        label: '设置',
        key: 'settings',
        to: { name: 'settings' },
      },
      {
        label: '文档',
        key: 'docs',
        onSelect: () => {
          window.open('https://github.com/auto-novel/auth', '_blank');
        },
      },
    ],
  },
];
</script>

<template>
  <AdminKitApp>
    <AdminKitLayout v-if="route.meta.requiresAuth" :menu-options="menuOptions" />
    <RouterView v-else />
  </AdminKitApp>
</template>
