<script setup lang="ts">
import {
  DashboardOutlined,
  GavelOutlined,
  HistoryOutlined,
  PeopleOutlined,
  SettingsOutlined,
} from '@vicons/material';
import { AdminKitApp, AdminKitLayout } from '@novelia/admin-kit';
import { NIcon, type MenuOption } from 'naive-ui';
import { h, type Component } from 'vue';
import { RouterView, useRoute } from 'vue-router';

const route = useRoute();

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions: MenuOption[] = [
  { label: '概览', key: '/overview', icon: renderIcon(DashboardOutlined) },
  { label: '用户管理', key: '/users', icon: renderIcon(PeopleOutlined) },
  { label: '处罚管理', key: '/strikes', icon: renderIcon(GavelOutlined) },
  { label: '事件记录', key: '/events', icon: renderIcon(HistoryOutlined) },
  { label: '系统设置', key: '/settings', icon: renderIcon(SettingsOutlined) },
];
</script>

<template>
  <AdminKitApp>
    <AdminKitLayout
      v-if="route.meta.requiresAuth"
      :menu-options="menuOptions"
    />
    <RouterView v-else />
  </AdminKitApp>
</template>
