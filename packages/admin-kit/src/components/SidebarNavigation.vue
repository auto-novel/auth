<script setup lang="ts">
import { NMenu, type MenuDividerOption, type MenuOption } from 'naive-ui';

import SidebarFooter from './SidebarFooter.vue';
import SidebarHeader from './SidebarHeader.vue';

defineProps<{
  activeKey: string;
  collapsed: boolean;
  options: Array<MenuOption | MenuDividerOption>;
  brand: string;
  repository?: {
    url: string;
    buildTime: string;
    commitSha: string;
  };
}>();

const emit = defineEmits<{ select: [key: string] }>();
</script>

<template>
  <div class="sidebar-navigation">
    <SidebarHeader :collapsed="collapsed" :brand="brand" />
    <n-menu
      :value="activeKey"
      :collapsed="collapsed"
      :collapsed-width="64"
      :options="options"
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
</style>
