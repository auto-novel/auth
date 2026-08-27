<script setup lang="ts">
import {
  DarkModeOutlined,
  KeyboardDoubleArrowLeftOutlined,
  KeyboardDoubleArrowRightOutlined,
  LightModeOutlined,
  MenuOutlined,
} from '@vicons/material';
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NPageHeader,
  NResult,
  NSpace,
  type MenuDividerOption,
  type MenuOption,
} from 'naive-ui';
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

import { useAdminKit, useAdminTheme } from '../context';
import SidebarNavigation from './SidebarNavigation.vue';
import UserAccountButton from './UserAccountButton.vue';

type ViewportMode = 'mobile' | 'tablet' | 'desktop';

const props = defineProps<{ menuOptions: MenuOption[] }>();
const mobileMenuOpen = ref(false);
const mobileMediaQuery = window.matchMedia('(max-width: 767px)');
const tabletMediaQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');

function getViewportMode(): ViewportMode {
  if (mobileMediaQuery.matches) return 'mobile';
  if (tabletMediaQuery.matches) return 'tablet';
  return 'desktop';
}

const viewportMode = ref<ViewportMode>(getViewportMode());
const isMobile = computed(() => viewportMode.value === 'mobile');
const collapsed = ref(viewportMode.value === 'tablet');
const { isDark, toggleTheme } = useAdminTheme();
const { options, isAuthorized } = useAdminKit();
const route = useRoute();
const router = useRouter();

const allMenuOptions = computed<Array<MenuOption | MenuDividerOption>>(() => [
  ...props.menuOptions,
  { type: 'divider', key: 'admin-kit-theme-divider' },
  {
    label: '切换主题',
    key: 'admin-kit-theme-toggle',
    icon: () => h(NIcon, null, {
      default: () => h(isDark.value ? DarkModeOutlined : LightModeOutlined),
    }),
  },
]);
const activeKey = computed(() => route.path);
const currentTitle = computed(() => String(route.meta.title ?? ''));

function handleMenuSelect(key: string) {
  if (key === 'admin-kit-theme-toggle') toggleTheme();
  else {
    mobileMenuOpen.value = false;
    void router.push(key);
  }
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
watch(() => route.path, () => { mobileMenuOpen.value = false; });
</script>

<template>
  <n-layout :has-sider="!isMobile" class="app-layout">
    <n-layout-sider v-if="!isMobile" bordered collapse-mode="width" :width="200" :collapsed-width="64" :collapsed="collapsed">
      <SidebarNavigation :active-key="activeKey" :collapsed="collapsed" :options="allMenuOptions" :brand="options.brand" :repository="options.repository" @select="handleMenuSelect" />
    </n-layout-sider>

    <n-drawer v-if="isMobile" v-model:show="mobileMenuOpen" :width="280" placement="left">
      <n-drawer-content body-content-style="padding: 0; height: 100%;" :native-scrollbar="false">
        <SidebarNavigation :active-key="activeKey" :collapsed="false" :options="allMenuOptions" :brand="options.brand" :repository="options.repository" @select="handleMenuSelect" />
      </n-drawer-content>
    </n-drawer>

    <n-layout class="page-layout">
      <n-layout-header bordered class="page-header">
        <div class="page-header__content">
          <n-space align="center">
            <n-button v-if="isMobile" class="sidebar-toggle" quaternary circle aria-label="打开导航菜单" title="打开导航菜单" @click="mobileMenuOpen = true">
              <template #icon><n-icon :component="MenuOutlined" /></template>
            </n-button>
            <n-button v-else class="sidebar-toggle" quaternary circle :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'" :title="collapsed ? '展开侧边栏' : '收起侧边栏'" @click="collapsed = !collapsed">
              <template #icon>
                <n-icon><component :is="collapsed ? KeyboardDoubleArrowRightOutlined : KeyboardDoubleArrowLeftOutlined" /></n-icon>
              </template>
            </n-button>
            <n-page-header :title="currentTitle" />
          </n-space>
          <UserAccountButton />
        </div>
      </n-layout-header>
      <n-layout-content class="page-content" content-style="padding: var(--page-content-padding)">
        <router-view v-if="isAuthorized" />
        <n-result
          v-else
          status="403"
          title="需要管理员权限"
          description="当前账号没有访问管理后台的权限。"
        />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.app-layout { height: 100dvh; }
.page-layout { min-width: 0; }
.page-header { height: 64px; padding: 0 24px; display: flex; align-items: center; }
.page-header__content { width: 100%; min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.sidebar-toggle:focus:not(:focus-visible) { color: var(--n-text-color); background-color: var(--n-color); }
.page-content { --page-content-padding: 24px; }
@media (max-width: 767px) {
  .page-header { padding: 0 16px; }
  .page-content { --page-content-padding: 16px; }
}
</style>
