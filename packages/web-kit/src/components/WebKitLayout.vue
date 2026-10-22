<script setup lang="ts">
import {
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CloseOutlined,
  MenuOutlined,
} from '@vicons/material';
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useRoute } from 'vue-router';

import { selectedGroupKeys } from '../utils/menu';
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
  activeGroups,
  (groups) => {
    for (const key of groups) expanded.value.add(key);
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

watch([viewportMode, () => route.fullPath], () => {
  mobileMenuOpen.value = false;
});

function toggleSidebar() {
  sidebarPreference.value = !sidebarPreference.value;
}

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

    <div v-if="!isMobile" class="sticky top-0 z-40 h-dvh flex-none self-start">
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
        class="absolute top-[80dvh] -right-3 grid size-6 cursor-pointer place-items-center rounded-full border border-border bg-surface text-muted shadow-[0_2px_4px_rgb(0_0_0_/_6%)] transition-[color,border-color] duration-150 ease-[ease] hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
          class="grid size-[2.125rem] flex-none place-items-center rounded-full text-ink transition-[color,background-color] duration-150 ease-[ease] hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
            v-if="$slots['header-actions']"
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
