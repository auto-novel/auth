<script setup lang="ts">
import {
  NMenu,
  type MenuDividerOption,
  type MenuGroupOption,
  type MenuOption,
} from 'naive-ui';
import { h, type VNodeChild } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';

import type { AdminKitMenuOption } from '../types';
import SidebarFooter from './SidebarFooter.vue';
import SidebarHeader from './SidebarHeader.vue';

defineProps<{
  activeKey: string;
  collapsed: boolean;
  options: Array<AdminKitMenuOption | MenuDividerOption>;
  brand: string;
  repository?: {
    url: string;
    buildTime: string;
    commitSha: string;
  };
}>();

const emit = defineEmits<{ select: [key: string] }>();

function optionLabel(option: MenuOption | MenuGroupOption): VNodeChild {
  const label = 'label' in option ? option.label : option.title;
  return (typeof label === 'function' ? label() : label) as VNodeChild;
}

function routeTarget(
  option: MenuOption | MenuGroupOption,
): RouteLocationRaw | undefined {
  const menuOption = option as AdminKitMenuOption;
  if (menuOption.disabled || menuOption.children?.length) return undefined;
  return menuOption.to;
}

function renderLabel(option: MenuOption | MenuGroupOption): VNodeChild {
  const to = routeTarget(option);
  const label = optionLabel(option);
  if (to === undefined) return label;

  return h(
    RouterLink,
    {
      class: 'admin-kit-menu-link',
      to,
      onClick: (event: MouseEvent) => event.stopPropagation(),
    },
    { default: () => label },
  );
}
</script>

<template>
  <div class="sidebar-navigation">
    <SidebarHeader :collapsed="collapsed" :brand="brand" />
    <n-menu
      :value="activeKey"
      :collapsed="collapsed"
      :collapsed-width="64"
      :options="options"
      :render-label="renderLabel"
      @update:value="emit('select', $event)"
    />
    <SidebarFooter
      v-if="repository"
      :class="{ 'sidebar-footer--collapsed': collapsed }"
      :repo-url="repository.url"
      :build-time="repository.buildTime"
      :commit-sha="repository.commitSha"
    />
  </div>
</template>

<style scoped>
.sidebar-navigation {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.n-menu-item-content .admin-kit-menu-link) {
  color: inherit;
  text-decoration: none;
}

:deep(.n-menu-item-content .admin-kit-menu-link::before) {
  position: absolute;
  z-index: 2;
  inset: 0;
  content: '';
}
</style>
