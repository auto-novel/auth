<script setup lang="ts">
import { isKnownRole, roleLabels, XButton } from '@novelia/web-kit';
import { computed } from 'vue';

import StatusTag from '@/components/StatusTag.vue';
import type { User, UserAction } from '@/api';

const props = defineProps<{ user: User; total: number }>();
const emit = defineEmits<{
  action: [action: UserAction, user: User];
}>();

const roleLabel = computed(() =>
  isKnownRole(props.user.role) ? roleLabels[props.user.role] : props.user.role,
);

const roleTones: Record<
  string,
  'neutral' | 'success' | 'warning' | 'error' | 'info'
> = {
  admin: 'error',
  trusted: 'success',
  member: 'info',
  restricted: 'neutral',
  banned: 'neutral',
};

const roleTextClasses: Record<string, string> = {
  admin: 'text-error',
  trusted: 'text-success',
  member: 'text-info',
  restricted: 'text-ink',
  banned: 'text-ink',
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
      <span class="text-muted user-id">#{{ formatId(user.id) }}</span>
      <StatusTag class="role-tag" :tone="roleTones[user.role] ?? 'neutral'">
        {{ roleLabel }}
      </StatusTag>
      <span
        class="role-text"
        :class="[
          roleTextClasses[user.role] ?? 'text-ink',
          { 'role-text--placeholder': user.role === 'member' },
        ]"
      >
        {{ roleLabel }}
      </span>
    </div>

    <div class="identity">
      <strong class="text-ink font-semibold username">
        {{ user.username }}
      </strong>
      <span class="text-muted email">{{ user.email }}</span>
    </div>

    <div class="metadata">
      <div class="field">
        <span class="text-muted field-label">注册</span>
        <span :title="formatDateTime(user.createdAt)" class="text-ink">
          {{ formatDate(user.createdAt) }}
        </span>
      </div>
      <div class="field">
        <span class="text-muted field-label">最近登录</span>
        <span :title="formatDateTime(user.lastLogin)" class="text-ink">
          {{ formatDate(user.lastLogin) }}
        </span>
      </div>
    </div>

    <div class="actions">
      <XButton
        v-if="user.role === 'member'"
        size="tiny"
        color="primary"
        variant="soft"
        @click="emit('action', 'trust', user)"
      >
        信任
      </XButton>
      <XButton
        v-if="user.role === 'trusted'"
        size="tiny"
        color="neutral"
        variant="soft"
        @click="emit('action', 'untrust', user)"
      >
        取消信任
      </XButton>
      <XButton
        v-if="user.role === 'member'"
        size="tiny"
        color="warning"
        variant="soft"
        @click="emit('action', 'restrict', user)"
      >
        限制
      </XButton>
      <XButton
        v-if="user.role === 'member'"
        size="tiny"
        color="danger"
        variant="soft"
        @click="emit('action', 'ban', user)"
      >
        封禁
      </XButton>
      <XButton
        v-if="user.role === 'restricted'"
        size="tiny"
        color="warning"
        variant="soft"
        @click="emit('action', 'unrestrict', user)"
      >
        取消限制
      </XButton>
      <XButton
        v-if="user.role === 'banned'"
        size="tiny"
        color="neutral"
        variant="soft"
        @click="emit('action', 'unban', user)"
      >
        取消封禁
      </XButton>
    </div>
  </div>
</template>

<style scoped>
.user-row {
  display: grid;
  grid-template-columns: 100px minmax(180px, 1fr) 150px 194px;
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
