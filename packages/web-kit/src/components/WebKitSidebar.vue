<script setup lang="ts">
import { DarkModeOutlined, LightModeOutlined } from '@vicons/material';
import { ref } from 'vue';

import { useWebKit } from '../context';
import type { WebKitMenuOption } from '../types';
import SidebarFooter from './SidebarFooter.vue';
import SidebarNavigation from './SidebarNavigation.vue';

defineProps<{
  options: WebKitMenuOption[];
  expanded: Set<string>;
  selected?: string;
  collapsed?: boolean;
  fullWidth?: boolean;
  mobileHeader?: boolean;
}>();

const emit = defineEmits<{
  select: [samePath: boolean];
}>();

const { options: kitOptions, theme } = useWebKit();
const { isDark, toggleTheme } = theme;
const showMascot = ref(false);
</script>

<template>
  <aside
    class="web-kit-sidebar flex h-full flex-col overflow-hidden border-r border-divider bg-surface"
    :class="[
      fullWidth ? 'w-full' : collapsed ? 'w-16' : 'w-60',
      { 'is-collapsed': collapsed },
    ]"
    aria-label="站点导航"
  >
    <div
      v-if="mobileHeader"
      class="relative h-[100px] flex-none bg-[#41a782]"
      aria-hidden="true"
    >
      <img
        src="../assets/mascot.webp"
        alt=""
        class="pointer-events-none absolute top-2 left-2 h-[120px] w-auto max-w-none"
      />
    </div>
    <div
      v-else
      class="brand-header"
      :title="collapsed ? kitOptions.brand : undefined"
    >
      <button
        type="button"
        class="grid size-9 flex-none cursor-pointer place-items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="showMascot ? '隐藏站娘' : '显示站娘'"
        :aria-pressed="showMascot"
        @click="showMascot = !showMascot"
      >
        <span class="brand-logo" aria-hidden="true" />
      </button>
      <span
        class="brand-title text-ink"
        :class="collapsed ? 'opacity-0' : 'opacity-100'"
        :aria-hidden="collapsed"
      >
        {{ kitOptions.brand }}
      </span>
    </div>

    <div
      class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-1"
      :class="{ 'mt-9': mobileHeader }"
    >
      <SidebarNavigation
        :options="options"
        :expanded="expanded"
        :selected="selected"
        :collapsed="collapsed"
        @select="emit('select', $event)"
      />

      <button
        type="button"
        class="web-kit-sidebar-item text-ink hover:bg-hover"
        :aria-label="isDark ? '切换到浅色主题' : '切换到深色主题'"
        :title="isDark ? '切换到浅色主题' : '切换到深色主题'"
        @click="toggleTheme"
      >
        <span
          class="grid size-5 flex-none place-items-center"
          aria-hidden="true"
        >
          <DarkModeOutlined v-if="isDark" class="size-5" />
          <LightModeOutlined v-else class="size-5" />
        </span>
        <span
          class="web-kit-sidebar-label"
          :class="collapsed ? 'opacity-0' : 'opacity-100'"
          :aria-hidden="collapsed"
        >
          切换主题
        </span>
      </button>
    </div>
    <SidebarFooter
      v-if="kitOptions.repository"
      :collapsed="collapsed"
      :repo-url="kitOptions.repository.url"
      :build-time="kitOptions.repository.buildTime"
      :commit-sha="kitOptions.repository.commitSha"
    />
  </aside>

  <Teleport to="body">
    <img
      v-if="showMascot && !mobileHeader"
      src="../assets/mascot.webp"
      alt=""
      aria-hidden="true"
      draggable="false"
      class="pointer-events-none fixed -right-[30px] -bottom-[30px] z-40 w-[200px] -rotate-[15deg] select-none"
    />
  </Teleport>
</template>

<style scoped>
.web-kit-sidebar {
  --web-kit-item-padding: 1.5rem;
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.web-kit-sidebar.is-collapsed {
  --web-kit-item-padding: 0.875rem;
}

.brand-header {
  display: flex;
  height: 50px;
  flex: none;
  align-items: center;
  gap: 10px;
  padding-inline: 14px;
}

.brand-logo {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  background-color: var(--color-primary);
  -webkit-mask: url('../assets/robot.svg') center / 32px 32px no-repeat;
  mask: url('../assets/robot.svg') center / 32px 32px no-repeat;
}

.brand-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.055em;
  transform: translateY(2px);
  transition: opacity 200ms ease;
}
</style>
