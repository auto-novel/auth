<script setup lang="ts">
import { LockOpenOutlined, PersonAddAltOutlined } from '@vicons/material';
import type { AuthActivitySummary } from '@novelia/auth-api';
import { NCard, NIcon, NText } from 'naive-ui';

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
  <section class="metric-grid" aria-label="认证活动汇总">
    <n-card class="metric-card">
      <div class="metric-content">
        <div>
          <n-text depth="3">登录次数</n-text>
          <n-text class="metric-value">
            {{ summary.loginCount.toLocaleString() }}
          </n-text>
          <n-text
            class="metric-change"
            :type="
              comparisonType(summary.loginCount, previousSummary.loginCount)
            "
          >
            {{
              comparisonLabel(summary.loginCount, previousSummary.loginCount)
            }}
          </n-text>
        </div>
        <span class="metric-icon login">
          <n-icon :component="LockOpenOutlined" />
        </span>
      </div>
    </n-card>

    <n-card class="metric-card">
      <div class="metric-content">
        <div>
          <n-text depth="3">新增用户</n-text>
          <n-text class="metric-value">
            {{ summary.newUsers.toLocaleString() }}
          </n-text>
          <n-text
            class="metric-change"
            :type="comparisonType(summary.newUsers, previousSummary.newUsers)"
          >
            {{ comparisonLabel(summary.newUsers, previousSummary.newUsers) }}
          </n-text>
        </div>
        <span class="metric-icon register">
          <n-icon :component="PersonAddAltOutlined" />
        </span>
      </div>
    </n-card>
  </section>
</template>

<style scoped>
.metric-grid {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 16px;
  min-width: 0;
}
.metric-card :deep(.n-card__content) {
  height: 100%;
  box-sizing: border-box;
  padding: 20px;
}
.metric-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.metric-content > div {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.metric-value {
  font-size: 28px;
  line-height: 1.15;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.metric-change {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.metric-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  font-size: 22px;
}
.metric-icon.login {
  color: var(--login);
  background: rgba(59, 130, 246, 0.11);
}
.metric-icon.register {
  color: var(--register);
  background: rgba(24, 160, 88, 0.11);
}

@media (max-width: 767px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: none;
  }
}
@media (max-width: 599px) {
  .metric-grid {
    gap: 10px;
  }
  .metric-card :deep(.n-card__content) {
    padding: 14px;
  }
  .metric-icon {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    font-size: 18px;
  }
  .metric-value {
    font-size: 22px;
  }
}
</style>
