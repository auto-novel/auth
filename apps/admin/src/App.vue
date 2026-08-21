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
        bordered
        style="
          height: 64px;
          padding: 0 24px;
          display: flex;
          align-items: center;
        "
      >
        <n-text strong>{{ collapsed ? 'A' : '管理后台' }}</n-text>
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
