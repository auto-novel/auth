<script setup lang="ts">
import {
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CloseOutlined,
  MenuOutlined,
} from '@vicons/material';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';

import type { WebKitMenuOption } from '../types';
import UserAccountButton from './UserAccountButton.vue';
import WebKitSidebar from './WebKitSidebar.vue';

type ViewportMode = 'mobile' | 'tablet' | 'desktop';

defineProps<{
  navigationOptions: WebKitMenuOption[];
  accountOptions: WebKitMenuOption[];
  selectedNavigationKey?: string;
}>();

const route = useRoute();
const mobileDrawer = useTemplateRef<HTMLElement>('mobileDrawer');
const pageContent = useTemplateRef<HTMLElement>('pageContent');
const mobileMediaQuery = window.matchMedia('(max-width: 767px)');
const tabletMediaQuery = window.matchMedia(
  '(min-width: 768px) and (max-width: 1023px)',
);

function getViewportMode(): ViewportMode {
  if (mobileMediaQuery.matches) return 'mobile';
  if (tabletMediaQuery.matches) return 'tablet';
  return 'desktop';
}

const viewportMode = ref<ViewportMode>(getViewportMode());
const mobileMenuOpen = ref(false);
const sidebarCollapsed = ref(viewportMode.value === 'tablet');
const isMobile = computed(() => viewportMode.value === 'mobile');

async function selectNavigation() {
  mobileMenuOpen.value = false;
  await nextTick();
  pageContent.value?.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateViewport() {
  const nextMode = getViewportMode();
  if (nextMode === viewportMode.value) return;
  viewportMode.value = nextMode;
  mobileMenuOpen.value = false;
  if (nextMode === 'tablet') sidebarCollapsed.value = true;
  if (nextMode === 'desktop') sidebarCollapsed.value = false;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') mobileMenuOpen.value = false;
}

async function openMobileMenu() {
  mobileMenuOpen.value = true;
  await nextTick();
  mobileDrawer.value?.focus();
}

onMounted(() => {
  mobileMediaQuery.addEventListener('change', updateViewport);
  tabletMediaQuery.addEventListener('change', updateViewport);
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  mobileMediaQuery.removeEventListener('change', updateViewport);
  tabletMediaQuery.removeEventListener('change', updateViewport);
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});

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
    pageContent.value?.scrollTo({ top: 0 });
  },
);

watch(mobileMenuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : '';
});
</script>

<template>
  <div class="web-kit-layout flex h-dvh overflow-hidden bg-paper">
    <div v-if="!isMobile" class="sidebar-shell">
      <WebKitSidebar
        :options="navigationOptions"
        :selected="selectedNavigationKey"
        :collapsed="sidebarCollapsed"
        class="flex-none"
        @select="selectNavigation"
      />
      <button
        type="button"
        class="sidebar-collapse"
        :aria-label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        :aria-expanded="!sidebarCollapsed"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        <component
          :is="sidebarCollapsed ? ChevronRightOutlined : ChevronLeftOutlined"
          class="size-[18px]"
          aria-hidden="true"
        />
      </button>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-200"
        leave-to-class="opacity-0"
      >
        <button
          v-if="isMobile && mobileMenuOpen"
          type="button"
          class="fixed inset-0 z-50 bg-black/40"
          aria-label="关闭导航菜单"
          @click="mobileMenuOpen = false"
        />
      </Transition>
      <Transition
        enter-active-class="transition-transform duration-200 ease-out"
        enter-from-class="-translate-x-full"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-to-class="-translate-x-full"
      >
        <div
          v-if="isMobile && mobileMenuOpen"
          ref="mobileDrawer"
          class="fixed inset-y-0 left-0 z-50 h-full w-70 max-w-[calc(100vw-3rem)] shadow-2xl outline-none"
          role="dialog"
          aria-modal="true"
          aria-label="站点导航"
          tabindex="-1"
        >
          <WebKitSidebar
            :options="navigationOptions"
            :selected="selectedNavigationKey"
            full-width
            @select="selectNavigation"
          />
          <button
            type="button"
            class="absolute top-3 right-3 grid size-10 place-items-center rounded-md text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="关闭导航菜单"
            @click="mobileMenuOpen = false"
          >
            <CloseOutlined class="size-5" aria-hidden="true" />
          </button>
        </div>
      </Transition>
    </Teleport>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="z-30 flex h-16 flex-none items-center gap-3 border-b border-divider bg-surface px-4 sm:px-6"
      >
        <button
          v-if="isMobile"
          type="button"
          class="layout-toggle"
          aria-label="打开导航菜单"
          title="打开导航菜单"
          :aria-expanded="mobileMenuOpen"
          @click="openMobileMenu"
        >
          <MenuOutlined class="size-5" aria-hidden="true" />
        </button>
        <UserAccountButton :options="accountOptions" />
      </header>

      <main ref="pageContent" class="min-h-0 flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.sidebar-shell {
  position: relative;
  z-index: 40;
  flex: none;
}

.sidebar-collapse {
  position: absolute;
  right: -12px;
  bottom: 48px;
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
