<script setup lang="ts">
import { NButton, NTag, NText } from 'naive-ui';

import type { User, UserAction } from '@novelia/auth-api';

const props = defineProps<{ user: User; total: number }>();
const emit = defineEmits<{
  action: [action: UserAction, user: User];
}>();

const roleLabels: Record<string, string> = {
  admin: '管理员',
  trusted: '可信用户',
  member: '普通用户',
  restricted: '受限用户',
  banned: '已封禁',
};

const roleTypes: Record<
  string,
  'default' | 'success' | 'warning' | 'error' | 'info'
> = {
  admin: 'error',
  trusted: 'success',
  member: 'info',
  restricted: 'default',
  banned: 'default',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatDateTime(value: string) {
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
  <div class="user-row">
    <div class="summary">
      <n-text depth="3" class="user-id">#{{ formatId(user.id) }}</n-text>
      <n-tag
        class="role-tag"
        size="small"
        :bordered="false"
        :type="roleTypes[user.role] ?? 'default'"
      >
        {{ roleLabels[user.role] ?? user.role }}
      </n-tag>
      <n-text
        class="role-text"
        :class="{ 'role-text--placeholder': user.role === 'member' }"
        :type="roleTypes[user.role] ?? 'default'"
      >
        {{ roleLabels[user.role] ?? user.role }}
      </n-text>
    </div>

    <div class="identity">
      <n-text strong class="username">{{ user.username }}</n-text>
      <n-text depth="3" class="email">{{ user.email }}</n-text>
    </div>

    <div class="metadata">
      <div class="field">
        <n-text depth="3" class="field-label">注册</n-text>
        <n-text :title="formatDateTime(user.createdAt)">
          {{ formatDate(user.createdAt) }}
        </n-text>
      </div>
      <div class="field">
        <n-text depth="3" class="field-label">最近登录</n-text>
        <n-text :title="formatDateTime(user.lastLogin)">
          {{ formatDate(user.lastLogin) }}
        </n-text>
      </div>
    </div>

    <div class="actions">
      <n-button
        v-if="user.role === 'member'"
        size="tiny"
        type="warning"
        secondary
        @click="emit('action', 'restrict', user)"
      >
        限制
      </n-button>
      <n-button
        v-if="user.role === 'member'"
        size="tiny"
        type="error"
        secondary
        @click="emit('action', 'ban', user)"
      >
        封禁
      </n-button>
      <n-button
        v-if="user.role === 'restricted'"
        size="tiny"
        type="warning"
        secondary
        @click="emit('action', 'unrestrict', user)"
      >
        取消限制
      </n-button>
      <n-button
        v-if="user.role === 'banned'"
        size="tiny"
        secondary
        @click="emit('action', 'unban', user)"
      >
        取消封禁
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.user-row {
  display: grid;
  grid-template-columns: 100px minmax(180px, 1fr) 150px 124px;
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

.role-text {
  display: none;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 767px) {
  .user-row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px 10px;
  }

  .identity {
    grid-column: 1;
    grid-row: 1;
    gap: 2px;
  }

  .summary {
    grid-column: 2;
    grid-row: 1;
    align-items: flex-end;
    gap: 2px;
    text-align: right;
  }

  .role-tag {
    display: none;
  }

  .role-text {
    display: inline;
    font-size: 12px;
  }

  .role-text--placeholder {
    visibility: hidden;
  }

  .metadata {
    grid-column: 1;
    grid-row: 2;
    flex-direction: row;
    gap: 10px;
  }

  .actions {
    grid-column: 2;
    grid-row: 2;
    justify-content: flex-end;
    gap: 4px;
  }

  .field {
    gap: 4px;
    font-size: 12px;
  }

  .field-label {
    width: auto;
  }
}
</style>
