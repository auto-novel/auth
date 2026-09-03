<script setup lang="ts">
import { AccessTimeOutlined, CommitOutlined } from '@vicons/material';
import { NA, NDivider, NIcon, NText, NTime } from 'naive-ui';
import { computed } from 'vue';

const props = defineProps<{
  repoUrl: string;
  buildTime: string;
  commitSha: string;
}>();

const builtAt = computed(() => new Date(props.buildTime));
const shortCommit = computed(() => props.commitSha.slice(0, 12));
const commitUrl = computed(() =>
  props.commitSha !== 'unknown'
    ? `${props.repoUrl.replace(/\/+$/, '')}/commit/${props.commitSha}`
    : undefined,
);
</script>

<template>
  <footer class="sidebar-footer">
    <n-divider class="sidebar-footer-divider" />
    <div class="sidebar-build-info-item">
      <n-icon :component="AccessTimeOutlined" :size="15" />
      <n-text depth="3">构建于</n-text>
      <n-time :time="builtAt" type="datetime" />
    </div>
    <div class="sidebar-build-info-item">
      <n-icon :component="CommitOutlined" :size="16" />
      <n-text depth="3">Commit</n-text>
      <n-a
        v-if="commitUrl"
        class="commit-link"
        :href="commitUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <code>{{ shortCommit }}</code>
      </n-a>
      <n-text v-else depth="3">
        <code>{{ shortCommit }}</code>
      </n-text>
    </div>
  </footer>
</template>

<style scoped>
.sidebar-footer {
  max-height: 88px;
  margin-top: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.4;
  transition:
    max-height 0.3s var(--n-bezier),
    padding 0.3s var(--n-bezier),
    opacity 0.2s var(--n-bezier);
}
.sidebar-footer-divider {
  margin: 0 0 6px;
}
.sidebar-build-info-item {
  display: flex;
  align-items: center;
  gap: 5px;
}
.sidebar-build-info-item .n-icon {
  flex: none;
}
.commit-link code {
  font-size: 11px;
}
.sidebar-footer--collapsed {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
