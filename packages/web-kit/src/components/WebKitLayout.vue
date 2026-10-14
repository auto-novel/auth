<script setup lang="ts">
import {
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CloseOutlined,
  MenuOutlined,
} from '@vicons/material';
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useRoute } from 'vue-router';

import { selectedGroupKeys } from '../menu';
import type { WebKitMenuOption } from '../types';
import XDrawer from '../ui/drawer/XDrawer.vue';
import { useWebKitViewport } from '../utils/viewport';
import UserAccountButton from './account/UserAccountButton.vue';
import { WebKitSidebar, useSidebarPreference } from './sidebar';

const props = defineProps<{
  navigationOptions: WebKitMenuOption[];
  accountOptions: WebKitMenuOption[];
  selectedNavigationKey?: string;
}>();

const route = useRoute();
const { viewportMode, isMobile } = useWebKitViewport();
const mobileMenuOpen = ref(false);
const mobileMenuId = useId();
const sidebarPreference = useSidebarPreference();
const sidebarCollapsed = computed(
  () => viewportMode.value === 'tablet' || sidebarPreference.value,
);
const expanded = ref(new Set<string>());
const activeGroups = computed(
  () =>
    selectedGroupKeys(props.navigationOptions, props.selectedNavigationKey) ??
    [],
);

watch(
  [() => props.selectedNavigationKey, () => JSON.stringify(activeGroups.value)],
  () => {
    for (const key of activeGroups.value) expanded.value.add(key);
  },
  { immediate: true },
);

async function selectNavigation(samePath: boolean) {
  mobileMenuOpen.value = false;
  if (samePath) {
    await nextTick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

watch(viewportMode, () => {
  mobileMenuOpen.value = false;
});

function toggleSidebar() {
  sidebarPreference.value = !sidebarPreference.value;
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
  },
);

watch(
  () => route.path,
  async () => {
    await nextTick();
    window.scrollTo({ top: 0 });
  },
);
</script>

<template>
  <div class="web-kit-layout flex min-h-dvh bg-body">
    <XDrawer
      :id="mobileMenuId"
      v-model:open="mobileMenuOpen"
      title="站点导航"
      side="left"
    >
      <WebKitSidebar
        :options="navigationOptions"
        :expanded="expanded"
        :selected="selectedNavigationKey"
        full-width
        mobile-header
        panel="modal"
        @select="selectNavigation"
      />
      <button
        type="button"
        class="absolute top-3 right-3 grid size-10 place-items-center rounded-md text-white transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="关闭导航菜单"
        @click="mobileMenuOpen = false"
      >
        <CloseOutlined class="size-5" aria-hidden="true" />
      </button>
    </XDrawer>

    <div v-if="!isMobile" class="sidebar-shell">
      <WebKitSidebar
        :options="navigationOptions"
        :expanded="expanded"
        :selected="selectedNavigationKey"
        :collapsed="sidebarCollapsed"
        class="flex-none"
        @select="selectNavigation"
      />
      <button
        v-if="viewportMode === 'desktop'"
        type="button"
        class="sidebar-collapse"
        :aria-label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        :aria-expanded="!sidebarCollapsed"
        @click="toggleSidebar"
      >
        <component
          :is="sidebarCollapsed ? ChevronRightOutlined : ChevronLeftOutlined"
          class="size-[18px]"
          aria-hidden="true"
        />
      </button>
    </div>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-30 flex h-[50px] flex-none items-center gap-3 border-b border-divider bg-surface px-2"
      >
        <button
          v-if="isMobile"
          type="button"
          class="layout-toggle"
          aria-label="打开导航菜单"
          title="打开导航菜单"
          aria-haspopup="dialog"
          :aria-expanded="mobileMenuOpen"
          :aria-controls="mobileMenuOpen ? mobileMenuId : undefined"
          @click="mobileMenuOpen = true"
        >
          <MenuOutlined class="size-6" aria-hidden="true" />
        </button>
        <div class="ml-auto flex min-w-0 flex-none items-center gap-1">
          <div
            v-if="isMobile && $slots['header-actions']"
            class="flex flex-none items-center gap-2"
          >
            <slot name="header-actions" />
          </div>
          <UserAccountButton :options="accountOptions" />
        </div>
      </header>

      <main class="min-w-0 flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.sidebar-shell {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 100dvh;
  flex: none;
  align-self: flex-start;
}

.sidebar-collapse {
  position: absolute;
  right: -12px;
  top: 80dvh;
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-muted);
  box-shadow: 0 2px 4px rgb(0 0 0 / 6%);
  cursor: pointer;
  transition:
    color 150ms ease,
    border-color 150ms ease;
}

.sidebar-collapse:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.sidebar-collapse:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.layout-toggle {
  display: grid;
  width: 2.125rem;
  height: 2.125rem;
  flex: none;
  place-items: center;
  border-radius: 9999px;
  color: var(--color-ink);
  transition:
    color 150ms ease,
    background-color 150ms ease;
}

.layout-toggle:hover {
  background: var(--color-hover);
  color: var(--color-ink);
}

.layout-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
