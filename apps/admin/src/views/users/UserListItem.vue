<script setup lang="ts">
import { NTag, NText } from 'naive-ui';

import type { User } from '@/data/users';

const props = defineProps<{ user: User; total: number }>();

const roleLabels: Record<string, string> = {
  admin: '管理员',
  trusted: '可信用户',
  member: '普通用户',
  restricted: '受限用户',
  banned: '已封禁',
};

const roleTypes: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  admin: 'error',
  trusted: 'success',
  member: 'info',
  restricted: 'default',
  banned: 'default',
};

function formatDate(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '—';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}

function formatId(id: number) {
  const digits = Math.max(1, String(props.total).length);
  return String(id).padStart(digits, '0');
}
</script>

<template>
  <div class="user-row">
    <div class="summary">
      <n-text depth="3" class="user-id">#{{ formatId(user.id) }}</n-text>
      <n-tag
        size="small"
        :bordered="false"
        :type="roleTypes[user.role] ?? 'default'"
      >
        {{ roleLabels[user.role] ?? user.role }}
      </n-tag>
    </div>

    <div class="identity">
      <n-text strong class="username">{{ user.name }}</n-text>
      <n-text depth="3" class="email">{{ user.email }}</n-text>
    </div>

    <div class="metadata">
      <div class="field">
        <n-text depth="3" class="field-label">注册</n-text>
        <n-text>{{ formatDate(user.createdAt) }}</n-text>
      </div>
      <div class="field">
        <n-text depth="3" class="field-label">最近登录</n-text>
        <n-text>{{ formatDate(user.lastLogin) }}</n-text>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-row {
  display: grid;
  grid-template-columns: 100px minmax(200px, 1fr) 200px;
  gap: 20px;
  align-items: center;
}

.summary,
.identity,
.metadata {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.field {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.username,
.email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-label {
  width: 52px;
  flex: none;
  font-size: 12px;
}

.user-id {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 767px) {
  .user-row {
    grid-template-columns: 1fr auto;
    gap: 6px 10px;
  }

  .identity {
    gap: 2px;
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
    flex-direction: row;
    gap: 16px;
  }

  .field {
    gap: 4px;
    font-size: 12px;
  }
}
</style>
