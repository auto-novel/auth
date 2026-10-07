<script setup lang="ts">
import {
  DashboardOutlined,
  GavelOutlined,
  HistoryOutlined,
  PeopleOutlined,
  SettingsOutlined,
} from '@vicons/material';
import {
  WebKitApp,
  WebKitLayout,
  type WebKitMenuOption,
  useWebKit,
} from '@novelia/web-kit';
import { darkTheme, NConfigProvider, NResult } from 'naive-ui';
import { RouterView, useRoute } from 'vue-router';

const route = useRoute();

const { whoami, theme } = useWebKit();
const { isDark } = theme;

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
  <NConfigProvider :theme="isDark ? darkTheme : null">
    <WebKitApp>
      <WebKitLayout
        :navigation-options="menuOptions"
        :account-options="[]"
        :selected-navigation-key="String(route.name ?? '')"
      >
        <div class="page-container py-4 md:py-6">
          <RouterView v-if="whoami.isAdmin" />
          <NResult
            v-else-if="whoami.isSignedIn"
            status="403"
            title="需要管理员权限"
            description="当前账号没有访问管理后台的权限。"
          />
          <p v-else class="py-12 text-center text-muted">
            请先通过右上角登录账号，再访问管理后台。
          </p>
        </div>
      </WebKitLayout>
    </WebKitApp>
  </NConfigProvider>
</template>
