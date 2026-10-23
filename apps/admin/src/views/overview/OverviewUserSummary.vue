<script setup lang="ts">
import {
  BlockOutlined,
  PeopleOutlined,
  ReportProblemOutlined,
} from '@vicons/material';
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
  <section class="summary-card rounded-[3px] border border-divider bg-surface">
    <header class="px-6 pt-[19px] pb-5 text-lg font-medium text-ink">
      用户概况
    </header>
    <div
      class="grid grid-cols-3 px-6 pt-2 pb-2 [@media(max-width:599px)]:grid-cols-1"
    >
      <div
        v-for="metric in metrics"
        :key="metric.label"
        class="summary-item flex min-w-0 items-center gap-3.5 px-5 py-3 [@media(max-width:599px)]:px-0"
      >
        <span
          class="inline-flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] text-[20px]"
          :class="['summary-icon', metric.className]"
        >
          <component :is="metric.icon" class="size-[1em]" aria-hidden="true" />
        </span>
        <div class="flex min-w-0 flex-col gap-1">
          <span class="text-muted">{{ metric.label }}</span>
          <span
            class="text-2xl leading-[1.15] font-[650] text-ink tabular-nums"
          >
            {{ metric.value.toLocaleString() }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.summary-item + .summary-item {
  border-left: 1px solid var(--color-divider);
}
.summary-icon.total {
  color: var(--login);
  background: rgba(59, 130, 246, 0.11);
}
.summary-icon.restricted {
  color: var(--color-warning);
  background: var(--color-warning-soft);
}
.summary-icon.banned {
  color: var(--color-error);
  background: var(--color-error-soft);
}

@media (max-width: 599px) {
  .summary-item + .summary-item {
    border-top: 1px solid var(--color-divider);
    border-left: 0;
  }
}
</style>
