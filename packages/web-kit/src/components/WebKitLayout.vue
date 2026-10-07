<script setup lang="ts">
import {
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CloseOutlined,
  MenuOutlined,
} from '@vicons/material';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from 'reka-ui';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';

import { layoutKey } from '../layoutContext';
import { selectedGroupKeys } from '../menu';
import type { WebKitMenuOption } from '../types';
import UserAccountButton from './UserAccountButton.vue';
import WebKitSidebar from './WebKitSidebar.vue';

type ViewportMode = 'mobile' | 'tablet' | 'desktop';

const props = defineProps<{
  navigationOptions: WebKitMenuOption[];
  accountOptions: WebKitMenuOption[];
  selectedNavigationKey?: string;
}>();

const route = useRoute();
const pageContent = useTemplateRef<HTMLElement>('pageContent');
// 媒体查询在 onMounted 里创建，setup 阶段不碰 window。
let mobileMediaQuery: MediaQueryList | undefined;
let tabletMediaQuery: MediaQueryList | undefined;

function getViewportMode(): ViewportMode {
  if (mobileMediaQuery?.matches) return 'mobile';
  if (tabletMediaQuery?.matches) return 'tablet';
  return 'desktop';
}

const viewportMode = ref<ViewportMode>('desktop');
const mobileMenuOpen = ref(false);
const sidebarCollapsed = ref(false);
const isMobile = computed(() => viewportMode.value === 'mobile');
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

provide(
  layoutKey,
  Object.freeze({
    scrollToTop(options?: ScrollToOptions) {
      pageContent.value?.scrollTo({ top: 0, ...options });
    },
  }),
);

async function selectNavigation(samePath: boolean) {
  mobileMenuOpen.value = false;
  if (samePath) {
    await nextTick();
    pageContent.value?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateViewport() {
  const nextMode = getViewportMode();
  if (nextMode === viewportMode.value) return;
  viewportMode.value = nextMode;
  mobileMenuOpen.value = false;
  if (nextMode === 'tablet') sidebarCollapsed.value = true;
  if (nextMode === 'desktop') sidebarCollapsed.value = false;
}

onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 767px)');
  tabletMediaQuery = window.matchMedia(
    '(min-width: 768px) and (max-width: 1023px)',
  );
  viewportMode.value = getViewportMode();
  sidebarCollapsed.value = viewportMode.value === 'tablet';
  mobileMediaQuery.addEventListener('change', updateViewport);
  tabletMediaQuery.addEventListener('change', updateViewport);
});

onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener('change', updateViewport);
  tabletMediaQuery?.removeEventListener('change', updateViewport);
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
</script>

<template>
  <DialogRoot v-model:open="mobileMenuOpen">
    <div class="web-kit-layout flex h-dvh overflow-hidden bg-paper">
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

      <DialogPortal>
        <Transition
          enter-active-class="transition-opacity duration-200"
          enter-from-class="opacity-0"
          leave-active-class="transition-opacity duration-200"
          leave-to-class="opacity-0"
        >
          <DialogOverlay class="fixed inset-0 z-50 bg-black/40" />
        </Transition>
        <Transition
          enter-active-class="transition-transform duration-200 ease-out"
          enter-from-class="-translate-x-full"
          leave-active-class="transition-transform duration-200 ease-in"
          leave-to-class="-translate-x-full"
        >
          <DialogContent
            :aria-describedby="undefined"
            class="fixed inset-y-0 left-0 z-50 h-full w-70 max-w-[calc(100vw-3rem)] shadow-2xl outline-none"
          >
            <DialogTitle class="sr-only">站点导航</DialogTitle>
            <WebKitSidebar
              :options="navigationOptions"
              :expanded="expanded"
              :selected="selectedNavigationKey"
              full-width
              mobile-header
              @select="selectNavigation"
            />
            <DialogClose as-child>
              <button
                type="button"
                class="absolute top-3 right-3 grid size-10 place-items-center rounded-md text-white transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="关闭导航菜单"
              >
                <CloseOutlined class="size-5" aria-hidden="true" />
              </button>
            </DialogClose>
          </DialogContent>
        </Transition>
      </DialogPortal>

      <div class="flex min-w-0 flex-1 flex-col">
        <header
          class="z-30 flex h-16 flex-none items-center gap-3 border-b border-divider bg-surface px-4 sm:px-6"
        >
          <DialogTrigger v-if="isMobile" as-child>
            <button
              type="button"
              class="layout-toggle"
              aria-label="打开导航菜单"
              title="打开导航菜单"
            >
              <MenuOutlined class="size-5" aria-hidden="true" />
            </button>
          </DialogTrigger>
          <UserAccountButton :options="accountOptions" />
        </header>

        <main
          ref="pageContent"
          class="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
        >
          <slot />
        </main>
      </div>
    </div>
  </DialogRoot>
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
