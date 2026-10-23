<script setup lang="ts">
import {
  DashboardOutlined,
  GavelOutlined,
  HistoryOutlined,
  PeopleOutlined,
  SettingsOutlined,
} from '@vicons/material';
import {
  AdminSiteSwitcher,
  WebKitApp,
  WebKitLayout,
  type WebKitMenuOption,
  useWebKit,
} from '@novelia/web-kit';
import { RouterView, useRoute } from 'vue-router';

const route = useRoute();

const { whoami } = useWebKit();

const menuOptions: WebKitMenuOption[] = [
  {
    label: '概览',
    key: 'overview',
    to: { name: 'overview' },
    icon: DashboardOutlined,
  },
  {
    label: '用户管理',
    key: 'users',
    to: { name: 'users' },
    icon: PeopleOutlined,
  },
  {
    label: '处罚管理',
    key: 'strikes',
    to: { name: 'strikes' },
    icon: GavelOutlined,
  },
  {
    label: '事件记录',
    key: 'events',
    to: { name: 'events' },
    icon: HistoryOutlined,
  },
  { type: 'divider', key: 'settings-divider' },
  {
    label: '系统设置',
    key: 'settings',
    to: { name: 'settings' },
    icon: SettingsOutlined,
  },
];
</script>

<template>
  <WebKitApp>
    <WebKitLayout
      :navigation-options="menuOptions"
      :account-options="[]"
      :selected-navigation-key="String(route.name ?? '')"
    >
      <template #header-actions>
        <AdminSiteSwitcher current="auth" />
      </template>
      <div class="page-container py-4 md:py-6">
        <RouterView v-if="whoami.isAdmin" />
        <div
          v-else-if="whoami.isSignedIn"
          class="flex flex-col items-center gap-2 py-16 text-center"
        >
          <span
            class="grid size-14 place-items-center rounded-full bg-error-soft text-lg font-semibold text-error-text"
            aria-hidden="true"
          >
            403
          </span>
          <h1 class="m-0 mt-2 text-lg font-semibold text-ink">
            需要管理员权限
          </h1>
          <p class="m-0 text-sm text-muted">当前账号没有访问管理后台的权限。</p>
        </div>
        <p v-else class="py-12 text-center text-muted">
          请先通过右上角登录账号，再访问管理后台。
        </p>
      </div>
    </WebKitLayout>
  </WebKitApp>
</template>
