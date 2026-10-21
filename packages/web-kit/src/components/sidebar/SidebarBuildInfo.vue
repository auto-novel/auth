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
    <div class="flex min-w-0 items-baseline gap-[5px] leading-4">
      <AccessTimeOutlined
        class="sidebar-build-info-icon size-4 flex-none self-center"
        aria-hidden="true"
      />
      <span class="flex-none">构建于</span>
      <XTime
        class="truncate text-ink"
        :time="buildTime"
        preset="datetime-numeric"
      />
    </div>
    <div class="flex min-w-0 items-baseline gap-[5px] leading-4">
      <CommitOutlined
        class="sidebar-build-info-icon size-4 flex-none self-center"
        aria-hidden="true"
      />
      <span class="flex-none">Commit</span>
      <a
        v-if="commitUrl"
        class="truncate text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        :href="commitUrl"
        :title="commitSha"
        target="_blank"
        rel="noopener noreferrer"
      >
        <code class="block text-[11px] leading-[inherit]">
          {{ shortCommit }}
        </code>
      </a>
      <code v-else class="block text-[11px] leading-[inherit]">
        {{ shortCommit }}
      </code>
    </div>
  </div>
</template>

<style scoped>
.sidebar-build-info-icon {
  /* 按文字的视觉中心对齐，而非包含下行留白的行框中心。 */
  transform: translateY(1px);
}
</style>
