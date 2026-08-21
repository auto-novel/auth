<script setup lang="ts">
import { NMenu, type MenuDividerOption, type MenuOption } from 'naive-ui';

import SidebarFooter from './SidebarFooter.vue';
import SidebarHeader from './SidebarHeader.vue';

defineProps<{
  activeKey: string;
  collapsed: boolean;
  options: Array<MenuOption | MenuDividerOption>;
  repoUrl: string;
}>();

const emit = defineEmits<{
  select: [key: string];
}>();
</script>

<template>
  <div class="sidebar-navigation">
    <SidebarHeader :collapsed="collapsed" brand="Auth" text="Admin" />
    <n-menu
      :value="activeKey"
      :collapsed="collapsed"
      :collapsed-width="64"
      :options="options"
      @update:value="emit('select', $event)"
    />
    <SidebarFooter
      :class="{ 'sidebar-footer--collapsed': collapsed }"
      :repo-url="repoUrl"
    />
  </div>
</template>

<style scoped>
.sidebar-navigation {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
