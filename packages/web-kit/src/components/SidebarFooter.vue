<script setup lang="ts">
import { AccessTimeOutlined, CommitOutlined } from '@vicons/material';
import { computed } from 'vue';

import XTime from '../ui/XTime.vue';
import XTooltip from '../ui/XTooltip.vue';

const props = defineProps<{
  repoUrl: string;
  buildTime: string;
  commitSha: string;
  collapsed?: boolean;
}>();

const shortCommit = computed(() => props.commitSha.slice(0, 12) || 'unknown');
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
      <div class="sidebar-build-info-item">
        <span>构建于</span>
        <XTime :time="buildTime" preset="datetime-numeric" />
      </div>
      <div class="commit-text">
        <span>Commit</span>
        <code class="commit-value">{{ shortCommit }}</code>
      </div>
    </XTooltip>
    <template v-else>
      <div class="mb-1.5 border-t border-divider" />
      <div class="sidebar-build-info-item">
        <AccessTimeOutlined class="size-[15px] flex-none" aria-hidden="true" />
        <span class="flex-none">构建于</span>
        <XTime
          class="truncate text-ink"
          :time="buildTime"
          preset="datetime-numeric"
        />
      </div>
      <div class="sidebar-build-info-item">
        <CommitOutlined class="size-4 flex-none" aria-hidden="true" />
        <div class="commit-text">
          <span class="flex-none">Commit</span>
          <a
            v-if="commitUrl"
            class="commit-link truncate text-primary hover:text-primary-hover"
            :href="commitUrl"
            :title="props.commitSha"
            target="_blank"
            rel="noopener noreferrer"
          >
            <code class="commit-value">{{ shortCommit }}</code>
          </a>
          <code v-else class="commit-value">{{ shortCommit }}</code>
        </div>
      </div>
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
