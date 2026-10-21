<script setup lang="ts">
import { AccessTimeOutlined, CommitOutlined } from '@vicons/material';
import { computed } from 'vue';

import XTime from '../../ui/time/XTime.vue';

const props = defineProps<{
  buildTime: string;
  commitSha: string;
  commitUrl?: string;
}>();

const shortCommit = computed(() => props.commitSha.slice(0, 12) || 'unknown');
</script>

<template>
  <div class="grid min-w-0 gap-1">
    <div class="sidebar-build-info-item min-w-0">
      <AccessTimeOutlined
        class="sidebar-build-info-icon size-4 flex-none"
        aria-hidden="true"
      />
      <span class="flex-none">构建于</span>
      <XTime
        class="truncate text-ink"
        :time="buildTime"
        preset="datetime-numeric"
      />
    </div>
    <div class="sidebar-build-info-item min-w-0">
      <CommitOutlined
        class="sidebar-build-info-icon size-4 flex-none"
        aria-hidden="true"
      />
      <span class="flex-none">Commit</span>
      <a
        v-if="commitUrl"
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
  </div>
</template>

<style scoped>
.sidebar-build-info-item {
  display: flex;
  align-items: baseline;
  gap: 5px;
  line-height: 16px;
}

.sidebar-build-info-icon {
  align-self: center;
  /* 按文字的视觉中心对齐，而非包含下行留白的行框中心。 */
  transform: translateY(1px);
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
