<script setup lang="ts">
import {
  DarkModeOutlined,
  DashboardOutlined,
  HistoryOutlined,
  KeyboardDoubleArrowLeftOutlined,
  KeyboardDoubleArrowRightOutlined,
  LightModeOutlined,
  PeopleOutlined,
  SettingsOutlined,
} from '@vicons/material';
import {
  darkTheme,
  NButton,
  NConfigProvider,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NMenu,
  NPageHeader,
  NSpace,
  type MenuDividerOption,
  type MenuOption,
} from 'naive-ui';
import { computed, h, ref, type Component } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

import SidebarFooter from './components/SidebarFooter.vue';
import SidebarHeader from './components/SidebarHeader.vue';

const collapsed = ref(false);
const savedTheme = localStorage.getItem('admin-theme');
const isDark = ref(
  savedTheme
    ? savedTheme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches,
);
const route = useRoute();
const router = useRouter();

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions = computed<Array<MenuOption | MenuDividerOption>>(() => [
  { label: '概览', key: '/overview', icon: renderIcon(DashboardOutlined) },
  { label: '用户管理', key: '/users', icon: renderIcon(PeopleOutlined) },
  { label: '操作记录', key: '/logs', icon: renderIcon(HistoryOutlined) },
  { label: '系统设置', key: '/settings', icon: renderIcon(SettingsOutlined) },
  { type: 'divider', key: 'theme-divider' },
  {
    label: '切换主题',
    key: 'theme-toggle',
    icon: renderIcon(isDark.value ? DarkModeOutlined : LightModeOutlined),
  },
]);

const activeKey = computed(() => route.path);
const currentTitle = computed(() => String(route.meta.title ?? ''));

function toggleTheme() {
  isDark.value = !isDark.value;
  localStorage.setItem('admin-theme', isDark.value ? 'dark' : 'light');
}

function handleMenuSelect(key: string) {
  if (key === 'theme-toggle') {
    toggleTheme();
    return;
  }

  void router.push(key);
}
</script>

<template>
  <n-config-provider :theme="isDark ? darkTheme : null">
    <n-layout has-sider style="height: 100vh">
      <n-layout-sider
        class="app-sidebar"
        bordered
        collapse-mode="width"
        :width="200"
        :collapsed-width="64"
        :collapsed="collapsed"
      >
        <SidebarHeader :collapsed="collapsed" brand="Auth" text="Admin" />
        <n-menu
          :value="activeKey"
          :collapsed="collapsed"
          :collapsed-width="64"
          :options="menuOptions"
          @update:value="handleMenuSelect"
        />
        <SidebarFooter
          :class="{ 'sidebar-footer--collapsed': collapsed }"
          repo-url="https://github.com/auto-novel/auth"
        />
      </n-layout-sider>
      <n-layout>
        <n-layout-header bordered class="page-header">
          <n-space align="center">
            <n-button
              class="sidebar-toggle"
              quaternary
              circle
              :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
              :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
              @click="collapsed = !collapsed"
            >
              <template #icon>
                <n-icon>
                  <component
                    :is="
                      collapsed
                        ? KeyboardDoubleArrowRightOutlined
                        : KeyboardDoubleArrowLeftOutlined
                    "
                  />
                </n-icon>
              </template>
            </n-button>
            <n-page-header :title="String(currentTitle)" />
          </n-space>
        </n-layout-header>
        <n-layout-content content-style="padding: 24px">
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<style scoped>
.page-header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
}

.sidebar-toggle:focus:not(:focus-visible) {
  color: var(--n-text-color);
  background-color: var(--n-color);
}

.app-sidebar :deep(.n-layout-sider-scroll-container) {
  display: flex;
  flex-direction: column;
}
</style>
