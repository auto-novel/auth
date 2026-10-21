<script setup lang="ts">
import { AdminPanelSettingsOutlined, CommitOutlined } from '@vicons/material';
import { computed } from 'vue';

import { useWebKit } from '../../context';
import XTooltip from '../../ui/tooltip/XTooltip.vue';
import SidebarBuildInfo from './SidebarBuildInfo.vue';

const props = defineProps<{
  repoUrl: string;
  buildTime: string;
  commitSha: string;
  collapsed?: boolean;
}>();

const { whoami } = useWebKit();

const commitUrl = computed(() =>
  props.commitSha && props.commitSha !== 'unknown'
    ? `${props.repoUrl.replace(/\/+$/, '')}/commit/${props.commitSha}`
    : undefined,
);
</script>

<template>
  <footer
    class="sidebar-footer mt-auto flex flex-none flex-col gap-1 overflow-hidden text-[12px] leading-[1.4] whitespace-nowrap text-muted"
    :class="{
      'sidebar-footer--collapsed h-14 items-center justify-center border-t border-divider':
        collapsed,
    }"
    aria-label="构建信息"
  >
    <XTooltip v-if="collapsed" side="right">
      <template #trigger>
        <component
          :is="commitUrl ? 'a' : 'button'"
          class="flex cursor-pointer items-center justify-center rounded-[3px] p-2 text-ink hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          :href="commitUrl"
          :type="commitUrl ? undefined : 'button'"
          :target="commitUrl ? '_blank' : undefined"
          :rel="commitUrl ? 'noopener noreferrer' : undefined"
          aria-label="查看构建信息"
        >
          <CommitOutlined class="size-5" aria-hidden="true" />
        </component>
      </template>
      <SidebarBuildInfo :build-time="buildTime" :commit-sha="commitSha" />
    </XTooltip>
    <template v-else>
      <div class="mb-1.5 border-t border-divider" />
      <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-1">
        <SidebarBuildInfo
          :build-time="buildTime"
          :commit-sha="commitSha"
          :commit-url="commitUrl"
        />
        <XTooltip v-if="whoami.isAdmin" side="top">
          <template #trigger>
            <a
              href="/admin/"
              class="grid w-8 place-items-center rounded-sm hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="管理后台"
            >
              <AdminPanelSettingsOutlined class="size-4" aria-hidden="true" />
            </a>
          </template>
          管理后台
        </XTooltip>
      </div>
    </template>
  </footer>
</template>

<style scoped>
.sidebar-footer {
  max-height: 88px;
  padding: 12px 14px;
  transition:
    max-height 300ms cubic-bezier(0.4, 0, 0.2, 1),
    padding 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-footer--collapsed {
  padding: 0;
}
</style>
