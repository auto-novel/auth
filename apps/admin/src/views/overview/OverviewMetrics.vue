<script setup lang="ts">
import { LockOpenOutlined, PersonAddAltOutlined } from '@vicons/material';

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

function comparisonClass(current: number, previous: number) {
  if (current === previous) return 'text-ink';
  return current > previous ? 'text-success' : 'text-warning';
}
</script>

<template>
  <section
    class="grid min-w-0 grid-rows-2 gap-4 [@media(max-width:767px)]:grid-cols-2 [@media(max-width:767px)]:grid-rows-none [@media(max-width:599px)]:gap-2.5"
    aria-label="认证活动汇总"
  >
    <section
      class="metric-card rounded-[3px] border border-divider bg-surface p-5 [@media(max-width:599px)]:p-3.5"
    >
      <div class="flex h-full items-center justify-between gap-4">
        <div class="flex flex-col gap-[7px]">
          <span class="text-muted">登录次数</span>
          <span
            class="text-[28px] leading-[1.15] font-[650] text-ink tabular-nums [@media(max-width:599px)]:text-[22px]"
          >
            {{ summary.loginCount.toLocaleString() }}
          </span>
          <span
            class="text-xs tabular-nums"
            :class="
              comparisonClass(summary.loginCount, previousSummary.loginCount)
            "
          >
            {{
              comparisonLabel(summary.loginCount, previousSummary.loginCount)
            }}
          </span>
        </div>
        <span
          class="metric-icon login inline-flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] text-[22px] [@media(max-width:599px)]:h-[34px] [@media(max-width:599px)]:w-[34px] [@media(max-width:599px)]:rounded-[9px] [@media(max-width:599px)]:text-[18px]"
        >
          <LockOpenOutlined class="size-[1em]" aria-hidden="true" />
        </span>
      </div>
    </section>

    <section
      class="metric-card rounded-[3px] border border-divider bg-surface p-5 [@media(max-width:599px)]:p-3.5"
    >
      <div class="flex h-full items-center justify-between gap-4">
        <div class="flex flex-col gap-[7px]">
          <span class="text-muted">新增用户</span>
          <span
            class="text-[28px] leading-[1.15] font-[650] text-ink tabular-nums [@media(max-width:599px)]:text-[22px]"
          >
            {{ summary.newUsers.toLocaleString() }}
          </span>
          <span
            class="text-xs tabular-nums"
            :class="comparisonClass(summary.newUsers, previousSummary.newUsers)"
          >
            {{ comparisonLabel(summary.newUsers, previousSummary.newUsers) }}
          </span>
        </div>
        <span
          class="metric-icon register inline-flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] text-[22px] [@media(max-width:599px)]:h-[34px] [@media(max-width:599px)]:w-[34px] [@media(max-width:599px)]:rounded-[9px] [@media(max-width:599px)]:text-[18px]"
        >
          <PersonAddAltOutlined class="size-[1em]" aria-hidden="true" />
        </span>
      </div>
    </section>
  </section>
</template>

<style scoped>
.metric-icon.login {
  color: var(--login);
  background: rgba(59, 130, 246, 0.11);
}
.metric-icon.register {
  color: var(--register);
  background: rgba(24, 160, 88, 0.11);
}
</style>
