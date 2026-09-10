<script setup lang="ts">
import { AccessTimeOutlined, CommitOutlined } from '@vicons/material';
import { computed } from 'vue';

const props = defineProps<{
  repoUrl: string;
  buildTime: string;
  commitSha: string;
  collapsed?: boolean;
}>();

const builtAt = computed(() => {
  const date = new Date(props.buildTime);
  return Number.isNaN(date.getTime()) ? undefined : date;
});
const formattedBuildTime = computed(() =>
  builtAt.value
    ? builtAt.value.toLocaleString('zh-CN', { hour12: false })
    : '未知时间',
);
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
    :inert="collapsed"
    :aria-hidden="collapsed"
    aria-label="构建信息"
  >
    <div class="mb-1.5 border-t border-divider" />
    <div
      class="sidebar-build-info-item"
      :title="`构建于 ${formattedBuildTime}`"
    >
      <AccessTimeOutlined class="size-[15px] flex-none" aria-hidden="true" />
      <span class="flex-none">构建于</span>
      <time class="truncate text-ink" :datetime="builtAt?.toISOString()">
        {{ formattedBuildTime }}
      </time>
    </div>
    <div class="sidebar-build-info-item">
      <CommitOutlined class="size-4 flex-none" aria-hidden="true" />
      <span class="flex-none">Commit</span>
      <a
        v-if="commitUrl"
        class="commit-link truncate text-primary hover:text-primary-hover"
        :href="commitUrl"
        :title="props.commitSha"
        target="_blank"
        rel="noopener noreferrer"
      >
        <code>{{ shortCommit }}</code>
      </a>
      <code v-else>{{ shortCommit }}</code>
    </div>
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
    padding 300ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 200ms ease;
}

.sidebar-build-info-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.commit-link code {
  font-size: 11px;
}

.commit-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.sidebar-footer--collapsed {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
