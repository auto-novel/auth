<script setup lang="ts">
import {
  DarkModeOutlined,
  DashboardOutlined,
  HistoryOutlined,
  KeyboardDoubleArrowLeftOutlined,
  KeyboardDoubleArrowRightOutlined,
  LightModeOutlined,
  MenuOutlined,
  PeopleOutlined,
  SettingsOutlined,
} from '@vicons/material';
import {
  darkTheme,
  NButton,
  NConfigProvider,
  NDrawer,
  NDrawerContent,
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
import {
  computed,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Component,
} from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

import SidebarFooter from './components/SidebarFooter.vue';
import SidebarHeader from './components/SidebarHeader.vue';

const mobileMenuOpen = ref(false);
const mobileMediaQuery = window.matchMedia('(max-width: 767px)');
const tabletMediaQuery = window.matchMedia(
  '(min-width: 768px) and (max-width: 1023px)',
);
type ViewportMode = 'mobile' | 'tablet' | 'desktop';

function getViewportMode(): ViewportMode {
  if (mobileMediaQuery.matches) return 'mobile';
  if (tabletMediaQuery.matches) return 'tablet';
  return 'desktop';
}

const viewportMode = ref<ViewportMode>(getViewportMode());
const isMobile = computed(() => viewportMode.value === 'mobile');
const collapsed = ref(viewportMode.value === 'tablet');
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

  mobileMenuOpen.value = false;
  void router.push(key);
}

function updateViewport() {
  const nextMode = getViewportMode();
  if (nextMode === viewportMode.value) return;

  viewportMode.value = nextMode;
  mobileMenuOpen.value = false;

  if (nextMode === 'tablet') collapsed.value = true;
  if (nextMode === 'desktop') collapsed.value = false;
}

onMounted(() => {
  updateViewport();
  mobileMediaQuery.addEventListener('change', updateViewport);
  tabletMediaQuery.addEventListener('change', updateViewport);
});

onBeforeUnmount(() => {
  mobileMediaQuery.removeEventListener('change', updateViewport);
  tabletMediaQuery.removeEventListener('change', updateViewport);
});

watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false;
  },
);
</script>

<template>
  <n-config-provider :theme="isDark ? darkTheme : null">
    <n-layout :has-sider="!isMobile" class="app-layout">
      <n-layout-sider
        v-if="!isMobile"
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

      <n-drawer
        v-if="isMobile"
        v-model:show="mobileMenuOpen"
        :width="280"
        placement="left"
      >
        <n-drawer-content
          body-content-style="padding: 0; height: 100%;"
          :native-scrollbar="false"
        >
          <div class="mobile-sidebar">
            <SidebarHeader :collapsed="false" brand="Auth" text="Admin" />
            <n-menu
              :value="activeKey"
              :options="menuOptions"
              @update:value="handleMenuSelect"
            />
            <SidebarFooter repo-url="https://github.com/auto-novel/auth" />
          </div>
        </n-drawer-content>
      </n-drawer>

      <n-layout class="page-layout">
        <n-layout-header bordered class="page-header">
          <n-space align="center">
            <n-button
              v-if="isMobile"
              class="sidebar-toggle"
              quaternary
              circle
              aria-label="打开导航菜单"
              title="打开导航菜单"
              @click="mobileMenuOpen = true"
            >
              <template #icon>
                <n-icon :component="MenuOutlined" />
              </template>
            </n-button>
            <n-button
              v-else
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
        <n-layout-content
          class="page-content"
          content-style="padding: var(--page-content-padding)"
        >
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<style scoped>
.app-layout {
  height: 100dvh;
}

.page-layout {
  min-width: 0;
}

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

.mobile-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-content {
  --page-content-padding: 24px;
}

@media (max-width: 767px) {
  .page-header {
    padding: 0 16px;
  }

  .page-content {
    --page-content-padding: 16px;
  }
}
</style>
