<script setup lang="ts">
import { AccessTimeOutlined, CommitOutlined } from '@vicons/material';
import { computed } from 'vue';

import XTime from '../../ui/time/XTime.vue';

const props = defineProps<{
  buildTime: string;
  commitSha: string;
  commitUrl?: string;
  /** 侧栏收起时用于 tooltip：不显示图标，Commit 不重复外链。 */
  compact?: boolean;
}>();

const shortCommit = computed(() => props.commitSha.slice(0, 12) || 'unknown');
</script>

<template>
  <div class="sidebar-build-info-item">
    <AccessTimeOutlined
      v-if="!compact"
      class="size-[15px] flex-none"
      aria-hidden="true"
    />
    <span class="flex-none">构建于</span>
    <XTime
      class="truncate text-ink"
      :time="buildTime"
      preset="datetime-numeric"
    />
  </div>
  <div :class="compact ? 'commit-text' : 'sidebar-build-info-item min-w-0'">
    <CommitOutlined
      v-if="!compact"
      class="size-4 flex-none"
      aria-hidden="true"
    />
    <span class="flex-none">Commit</span>
    <a
      v-if="!compact && commitUrl"
      class="commit-link truncate text-primary hover:text-primary-hover"
      :href="commitUrl"
      :title="commitSha"
      target="_blank"
      rel="noopener noreferrer"
    >
      <code class="commit-value">{{ shortCommit }}</code>
    </a>
    <code v-else class="commit-value">{{ shortCommit }}</code>
  </div>
</template>

<style scoped>
.sidebar-build-info-item {
  display: flex;
  align-items: center;
  gap: 5px;
  line-height: 16px;
}

.commit-text {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 5px;
  line-height: 16px;
}

.commit-value {
  display: block;
  font-size: 11px;
  line-height: inherit;
}

.commit-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
</style>
