<script setup lang="ts">
import { NTag, NText } from 'naive-ui';
import { computed } from 'vue';

import type { Event } from '@/data/events';

interface EventDetail {
  actor_user?: string;
  target_user?: string;
  [key: string]: unknown;
}

const props = defineProps<{ event: Event; total: number }>();

const actionLabels: Record<string, string> = {
  login: '登录',
  register: '注册',
  logout: '退出登录',
  otp: '发送验证码',
  reset_password: '重置密码',
  'restrict-user': '限制用户',
  'unrestrict-user': '取消限制',
  'ban-user': '封禁用户',
  'unban-user': '取消封禁',
  'strike-user': '警告用户',
};

const actionTypes: Record<
  string,
  'default' | 'success' | 'warning' | 'error' | 'info'
> = {
  login: 'success',
  register: 'info',
  logout: 'default',
  otp: 'info',
  reset_password: 'warning',
  'restrict-user': 'warning',
  'unrestrict-user': 'success',
  'ban-user': 'error',
  'unban-user': 'success',
  'strike-user': 'warning',
};

const detail = computed<EventDetail>(() => {
  try {
    const value: unknown = JSON.parse(props.event.detail);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as EventDetail;
    }
  } catch {
    // Malformed legacy details are shown as their original text below.
  }
  return {};
});

const formattedDetail = computed(() => {
  try {
    return JSON.stringify(JSON.parse(props.event.detail));
  } catch {
    return props.event.detail || '—';
  }
});

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function formatId(id: number) {
  const digits = Math.max(1, String(props.total).length);
  return String(id).padStart(digits, '0');
}
</script>

<template>
  <div class="event-row">
    <div class="summary">
      <n-text depth="3" class="event-id">#{{ formatId(event.id) }}</n-text>
      <n-tag
        size="small"
        :bordered="false"
        :type="actionTypes[event.action] ?? 'default'"
      >
        {{ actionLabels[event.action] ?? event.action }}
      </n-tag>
    </div>

    <div class="participants">
      <div class="field">
        <n-text depth="3" class="field-label">操作者</n-text>
        <n-text class="field-value">{{ detail.actor_user || '—' }}</n-text>
      </div>
      <div class="field">
        <n-text depth="3" class="field-label">目标</n-text>
        <n-text class="field-value">{{ detail.target_user || '—' }}</n-text>
      </div>
    </div>

    <div class="metadata">
      <div class="field">
        <n-text depth="3" class="field-label">详情</n-text>
        <n-text class="field-value detail" :title="formattedDetail">
          {{ formattedDetail }}
        </n-text>
      </div>
      <div class="field">
        <n-text depth="3" class="field-label">时间</n-text>
        <n-text class="field-value">{{ formatDate(event.createdAt) }}</n-text>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-row {
  display: grid;
  grid-template-columns: 110px minmax(170px, 0.8fr) minmax(300px, 1.4fr);
  gap: 20px;
  align-items: center;
}

.summary,
.participants,
.metadata {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.field {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.field-label {
  width: 40px;
  flex: none;
  font-size: 12px;
}

.field-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.event-id {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 767px) {
  .event-row {
    grid-template-columns: 1fr auto;
    gap: 6px 10px;
  }

  .participants {
    grid-column: 1;
    grid-row: 1;
  }

  .summary {
    grid-column: 2;
    grid-row: 1;
    align-items: flex-end;
    gap: 2px;
  }

  .metadata {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .field {
    gap: 4px;
    font-size: 12px;
  }
}
</style>
