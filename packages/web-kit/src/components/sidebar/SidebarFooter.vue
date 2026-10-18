<script setup lang="ts">
import { CommitOutlined } from '@vicons/material';
import { computed } from 'vue';

import XTooltip from '../../ui/tooltip/XTooltip.vue';
import SidebarBuildInfo from './SidebarBuildInfo.vue';

const props = defineProps<{
  repoUrl: string;
  buildTime: string;
  commitSha: string;
  collapsed?: boolean;
}>();

const commitUrl = computed(() =>
  props.commitSha && props.commitSha !== 'unknown'
    ? `${props.repoUrl.replace(/\/+$/, '')}/commit/${props.commitSha}`
    : undefined,
);
</script>

<template>
  <footer
    class="sidebar-footer text-muted"
    :class="{ 'sidebar-footer--collapsed': collapsed }"
    aria-label="构建信息"
  >
    <XTooltip v-if="collapsed" side="right">
      <template #trigger>
        <component
          :is="commitUrl ? 'a' : 'button'"
          class="sidebar-build-info-trigger text-ink hover:bg-hover"
          :href="commitUrl"
          :type="commitUrl ? undefined : 'button'"
          :target="commitUrl ? '_blank' : undefined"
          :rel="commitUrl ? 'noopener noreferrer' : undefined"
          aria-label="查看构建信息"
        >
          <CommitOutlined class="size-5" aria-hidden="true" />
        </component>
      </template>
      <SidebarBuildInfo
        compact
        :build-time="buildTime"
        :commit-sha="commitSha"
      />
    </XTooltip>
    <template v-else>
      <div class="mb-1.5 border-t border-divider" />
      <SidebarBuildInfo
        :build-time="buildTime"
        :commit-sha="commitSha"
        :commit-url="commitUrl"
      />
    </template>
  </footer>
</template>

<style scoped>
.sidebar-footer {
  max-height: 88px;
  margin-top: auto;
  padding: 12px 14px;
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.4;
  transition:
    max-height 300ms cubic-bezier(0.4, 0, 0.2, 1),
    padding 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-footer--collapsed {
  height: 56px;
  padding: 0;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--color-divider);
}

.sidebar-build-info-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 3px;
  cursor: pointer;
}

.sidebar-build-info-trigger:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
</style>
