<script setup lang="ts">
import {
  BlockOutlined,
  PeopleOutlined,
  ReportProblemOutlined,
} from '@vicons/material';
import { NCard, NIcon, NText } from 'naive-ui';
import { computed } from 'vue';

import type { OverviewUserSummary } from '@/api';

const props = defineProps<{ summary: OverviewUserSummary }>();

const metrics = computed(() => [
  {
    label: '总用户数',
    value: props.summary.totalUsers,
    icon: PeopleOutlined,
    className: 'total',
  },
  {
    label: '受限用户',
    value: props.summary.restrictedUsers,
    icon: ReportProblemOutlined,
    className: 'restricted',
  },
  {
    label: '封禁用户',
    value: props.summary.bannedUsers,
    icon: BlockOutlined,
    className: 'banned',
  },
]);
</script>

<template>
  <n-card class="summary-card" title="用户概况">
    <div class="summary-grid">
      <div v-for="metric in metrics" :key="metric.label" class="summary-item">
        <span :class="['summary-icon', metric.className]">
          <n-icon :component="metric.icon" />
        </span>
        <div>
          <n-text depth="3">{{ metric.label }}</n-text>
          <n-text class="summary-value">
            {{ metric.value.toLocaleString() }}
          </n-text>
        </div>
      </div>
    </div>
  </n-card>
</template>

<style scoped>
.summary-card :deep(.n-card__content) {
  padding-top: 8px;
  padding-bottom: 8px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.summary-item {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
}
.summary-item + .summary-item {
  border-left: 1px solid var(--n-border-color);
}
.summary-item > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  font-size: 20px;
}
.summary-icon.total {
  color: var(--login);
  background: rgba(59, 130, 246, 0.11);
}
.summary-icon.restricted {
  color: #f0a020;
  background: rgba(240, 160, 32, 0.12);
}
.summary-icon.banned {
  color: #d03050;
  background: rgba(208, 48, 80, 0.11);
}
.summary-value {
  font-size: 24px;
  line-height: 1.15;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 599px) {
  .summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .summary-item {
    padding-inline: 0;
  }
  .summary-item + .summary-item {
    border-top: 1px solid var(--n-border-color);
    border-left: 0;
  }
}
</style>
