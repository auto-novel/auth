<script setup lang="ts">
import { LockOpenOutlined, PersonAddAltOutlined } from '@vicons/material';
import { NCard, NIcon, NText } from 'naive-ui';

import type { AuthActivitySummary } from '@/api';

const props = defineProps<{
  summary: AuthActivitySummary;
  previousSummary: AuthActivitySummary;
}>();

function comparisonLabel(current: number, previous: number) {
  if (current === previous) return '与上期持平';
  if (previous === 0) return '上期为 0';

  const change = ((current - previous) / previous) * 100;
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${change.toFixed(1)}% 较上期`;
}

function comparisonType(current: number, previous: number) {
  if (current === previous) return 'default';
  return current > previous ? 'success' : 'warning';
}
</script>

<template>
  <section
    class="grid min-w-0 grid-rows-2 gap-4 [@media(max-width:767px)]:grid-cols-2 [@media(max-width:767px)]:grid-rows-none [@media(max-width:599px)]:gap-2.5"
    aria-label="认证活动汇总"
  >
    <n-card class="metric-card">
      <div class="flex h-full items-center justify-between gap-4">
        <div class="flex flex-col gap-[7px]">
          <n-text depth="3">登录次数</n-text>
          <n-text
            class="text-[28px]! leading-[1.15]! font-[650]! tabular-nums [@media(max-width:599px)]:text-[22px]!"
          >
            {{ summary.loginCount.toLocaleString() }}
          </n-text>
          <n-text
            class="text-[12px]! tabular-nums"
            :type="
              comparisonType(summary.loginCount, previousSummary.loginCount)
            "
          >
            {{
              comparisonLabel(summary.loginCount, previousSummary.loginCount)
            }}
          </n-text>
        </div>
        <span
          class="metric-icon login inline-flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] text-[22px] [@media(max-width:599px)]:h-[34px] [@media(max-width:599px)]:w-[34px] [@media(max-width:599px)]:rounded-[9px] [@media(max-width:599px)]:text-[18px]"
        >
          <n-icon :component="LockOpenOutlined" />
        </span>
      </div>
    </n-card>

    <n-card class="metric-card">
      <div class="flex h-full items-center justify-between gap-4">
        <div class="flex flex-col gap-[7px]">
          <n-text depth="3">新增用户</n-text>
          <n-text
            class="text-[28px]! leading-[1.15]! font-[650]! tabular-nums [@media(max-width:599px)]:text-[22px]!"
          >
            {{ summary.newUsers.toLocaleString() }}
          </n-text>
          <n-text
            class="text-[12px]! tabular-nums"
            :type="comparisonType(summary.newUsers, previousSummary.newUsers)"
          >
            {{ comparisonLabel(summary.newUsers, previousSummary.newUsers) }}
          </n-text>
        </div>
        <span
          class="metric-icon register inline-flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] text-[22px] [@media(max-width:599px)]:h-[34px] [@media(max-width:599px)]:w-[34px] [@media(max-width:599px)]:rounded-[9px] [@media(max-width:599px)]:text-[18px]"
        >
          <n-icon :component="PersonAddAltOutlined" />
        </span>
      </div>
    </n-card>
  </section>
</template>

<style scoped>
.metric-card :deep(.n-card__content) {
  height: 100%;
  box-sizing: border-box;
  padding: 20px;
}
.metric-icon.login {
  color: var(--login);
  background: rgba(59, 130, 246, 0.11);
}
.metric-icon.register {
  color: var(--register);
  background: rgba(24, 160, 88, 0.11);
}

@media (max-width: 599px) {
  .metric-card :deep(.n-card__content) {
    padding: 14px;
  }
}
</style>
