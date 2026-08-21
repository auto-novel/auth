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
  lightTheme,
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
  NText,
  type MenuDividerOption,
  type MenuOption,
} from 'naive-ui';
import { computed, h, ref, type Component } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

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
const primaryColor = computed(
  () => (isDark.value ? darkTheme : lightTheme).common.primaryColor,
);

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
        bordered
        collapse-mode="width"
        :width="200"
        :collapsed-width="64"
        :collapsed="collapsed"
      >
        <n-layout-header
          class="brand-header"
          :class="{ 'brand-header--collapsed': collapsed }"
        >
          <span
            class="brand-logo"
            aria-hidden="true"
            :style="{ color: primaryColor }"
          >
            <span class="brand-logo__image" />
          </span>
          <n-text class="brand-title">
            <span class="brand-title__auth">Auth</span>
            <span
              class="brand-title__divider"
              aria-hidden="true"
              :style="{ backgroundColor: primaryColor }"
            />
            <span class="brand-title__admin" :style="{ color: primaryColor }">
              Admin
            </span>
          </n-text>
        </n-layout-header>
        <n-menu
          :value="activeKey"
          :collapsed="collapsed"
          :collapsed-width="64"
          :options="menuOptions"
          @update:value="handleMenuSelect"
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

.brand-header {
  height: 64px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition:
    gap 0.3s var(--n-bezier),
    color 0.3s var(--n-bezier),
    background-color 0.3s var(--n-bezier),
    box-shadow 0.3s var(--n-bezier),
    border-color 0.3s var(--n-bezier);
}

.brand-logo {
  height: 36px;
  flex: 0 0 36px;
  display: grid;
  place-items: center;
}

.brand-logo__image {
  width: 32px;
  height: 32px;
  background-color: currentColor;
  -webkit-mask: url('./assets/robot.svg') center / contain no-repeat;
  mask: url('./assets/robot.svg') center / contain no-repeat;
  transition: background-color 0.3s var(--n-bezier);
}

.brand-title {
  max-width: 112px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  transform: translateY(2px);
  gap: 5px;
  font-size: 16px;
  line-height: 1;
  transition:
    max-width 0.3s ease,
    opacity 0.2s ease,
    color 0.3s var(--n-bezier);
}

.brand-title__auth {
  font-weight: 800;
  letter-spacing: -0.055em;
}

.brand-title__divider {
  width: 4px;
  height: 4px;
  flex: none;
  border-radius: 1px;
  transform: rotate(45deg);
  transition: background-color 0.3s var(--n-bezier);
}

.brand-title__admin {
  font-weight: 650;
  letter-spacing: -0.025em;
  transition: color 0.3s var(--n-bezier);
}

.brand-header--collapsed {
  gap: 0;
}

.brand-header--collapsed .brand-title {
  max-width: 0;
  opacity: 0;
}
</style>
