<script setup lang="ts">
import { DarkModeOutlined, LightModeOutlined } from '@vicons/material';

import { useWebKit, useWebTheme } from '../context';
import type { WebKitMenuOption } from '../types';
import SidebarNavigation from './SidebarNavigation.vue';

defineProps<{
  options: WebKitMenuOption[];
  selected?: string;
  collapsed?: boolean;
  fullWidth?: boolean;
}>();

const emit = defineEmits<{
  select: [option: WebKitMenuOption];
}>();

const { options: kitOptions } = useWebKit();
const { isDark, toggleTheme } = useWebTheme();
</script>

<template>
  <aside
    class="web-kit-sidebar flex h-full flex-col overflow-hidden border-r border-divider bg-surface"
    :class="fullWidth ? 'w-full' : collapsed ? 'w-16' : 'w-56'"
    aria-label="站点导航"
  >
    <div class="flex h-16 min-w-56 flex-none items-center px-4">
      <span class="brand-logo" aria-hidden="true" />
      <span
        class="sidebar-label ml-2.5 text-sm font-bold tracking-tight whitespace-nowrap text-ink"
        :class="collapsed ? 'opacity-0' : 'opacity-100'"
        :aria-hidden="collapsed"
      >
        {{ kitOptions.brand }}
      </span>
    </div>

    <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-2">
      <SidebarNavigation
        :options="options"
        :selected="selected"
        :collapsed="collapsed"
        @select="emit('select', $event)"
      />

      <div class="my-2 min-w-52 border-t border-divider" role="separator" />
      <button
        type="button"
        class="theme-toggle"
        aria-label="切换主题"
        title="切换主题"
        @click="toggleTheme"
      >
        <span
          class="grid size-7 flex-none place-items-center"
          aria-hidden="true"
        >
          <LightModeOutlined v-if="isDark" class="size-5" />
          <DarkModeOutlined v-else class="size-5" />
        </span>
        <span
          class="sidebar-label whitespace-nowrap"
          :class="collapsed ? 'opacity-0' : 'opacity-100'"
          :aria-hidden="collapsed"
        >
          切换主题
        </span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.web-kit-sidebar {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.brand-logo {
  width: 2rem;
  height: 2rem;
  flex: 0 0 2rem;
  background-color: var(--color-primary);
  -webkit-mask: url('../assets/robot.svg') center / contain no-repeat;
  mask: url('../assets/robot.svg') center / contain no-repeat;
}

.sidebar-label {
  transition: opacity 150ms ease;
}

.theme-toggle {
  display: flex;
  min-height: 2.75rem;
  width: 100%;
  min-width: 13rem;
  align-items: center;
  gap: 0.7rem;
  border-radius: 0.25rem;
  padding-inline: 0.625rem;
  color: var(--color-ink);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: left;
  transition:
    color 150ms ease,
    background-color 150ms ease;
}

.theme-toggle:hover {
  background: var(--color-paper);
  color: var(--color-ink);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
