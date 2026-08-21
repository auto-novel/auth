<script setup lang="ts">
import {
  DashboardOutlined,
  HistoryOutlined,
  KeyboardDoubleArrowLeftOutlined,
  KeyboardDoubleArrowRightOutlined,
  PeopleOutlined,
  SettingsOutlined,
} from '@vicons/material';
import {
  NButton,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NMenu,
  NPageHeader,
  NSpace,
  NText,
  type MenuOption,
} from 'naive-ui';
import { computed, h, ref, type Component } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

import robotIconUrl from './assets/robot.svg';

const collapsed = ref(false);
const route = useRoute();
const router = useRouter();

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions: MenuOption[] = [
  { label: '概览', key: '/overview', icon: renderIcon(DashboardOutlined) },
  { label: '用户管理', key: '/users', icon: renderIcon(PeopleOutlined) },
  { label: '操作记录', key: '/logs', icon: renderIcon(HistoryOutlined) },
  { label: '系统设置', key: '/settings', icon: renderIcon(SettingsOutlined) },
];

const activeKey = computed(() => route.path);
const currentTitle = computed(() => String(route.meta.title ?? ''));

function navigateTo(path: string) {
  void router.push(path);
}
</script>

<template>
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
        <span class="brand-logo" aria-hidden="true">
          <img :src="robotIconUrl" alt="" />
        </span>
        <n-text class="brand-title">
          <span class="brand-title__auth">Auth</span>
          <span class="brand-title__divider" aria-hidden="true" />
          <span class="brand-title__admin">Admin</span>
        </n-text>
      </n-layout-header>
      <n-menu
        :value="activeKey"
        :collapsed="collapsed"
        :collapsed-width="64"
        :options="menuOptions"
        @update:value="navigateTo"
      />
    </n-layout-sider>
    <n-layout>
      <n-layout-header
        bordered
        style="
          height: 64px;
          padding: 0 24px;
          display: flex;
          align-items: center;
        "
      >
        <n-space align="center">
          <n-button
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
</template>

<style scoped>
.brand-header {
  height: 64px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: gap 0.3s ease;
}

.brand-logo {
  height: 36px;
  flex: 0 0 36px;
  display: grid;
  place-items: center;
}

.brand-logo img {
  width: 32px;
  height: 32px;
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
    opacity 0.2s ease;
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
  background: var(--primary-color, #18a058);
  transform: rotate(45deg);
}

.brand-title__admin {
  color: var(--primary-color, #18a058);
  font-weight: 650;
  letter-spacing: -0.025em;
}

.brand-header--collapsed {
  gap: 0;
}

.brand-header--collapsed .brand-title {
  max-width: 0;
  opacity: 0;
}
</style>
