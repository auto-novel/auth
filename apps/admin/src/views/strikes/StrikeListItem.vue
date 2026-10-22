<script setup lang="ts">
import { XButton } from '@novelia/web-kit';
import { NTag } from 'naive-ui';

import type { Strike } from '@/api';

const props = defineProps<{ strike: Strike; total: number }>();
defineEmits<{
  revoke: [strike: Strike];
}>();

function formatDate(value?: string) {
  if (!value) return '—';
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
  <div class="strike-row">
    <div class="summary">
      <span class="text-muted strike-id">#{{ formatId(strike.id) }}</span>
      <n-tag
        size="small"
        :bordered="false"
        :type="strike.revokedAt ? 'default' : 'warning'"
      >
        {{ strike.revokedAt ? '已撤销' : `${strike.point} 分` }}
      </n-tag>
    </div>

    <div class="participants">
      <div class="field">
        <span class="text-muted field-label">目标用户</span>
        <span
          class="text-ink field-value"
          :title="strike.username ?? undefined"
        >
          {{ strike.username ?? '—' }}
        </span>
      </div>
      <div class="field">
        <span class="text-muted field-label">操作者</span>
        <span class="text-ink field-value" :title="strike.operatorUsername">
          {{ strike.operatorUsername ?? '—' }}
        </span>
      </div>
    </div>

    <div class="details">
      <div class="field">
        <span class="text-muted field-label">原因</span>
        <span class="text-ink field-value" :title="strike.reason">
          {{ strike.reason }}
        </span>
      </div>
      <div class="field">
        <span class="text-muted field-label">证据</span>
        <span class="text-ink field-value" :title="strike.evidence">
          {{ strike.evidence }}
        </span>
      </div>
    </div>

    <div class="metadata">
      <div class="field">
        <span class="text-muted field-label">记录时间</span>
        <span class="text-ink field-value">
          {{ formatDate(strike.createdAt) }}
        </span>
      </div>
      <div v-if="strike.revokedAt" class="field">
        <span class="text-muted field-label">撤销时间</span>
        <span
          class="text-ink field-value"
          :title="`撤销人 ${strike.revokedByUsername ?? '—'}`"
        >
          {{ formatDate(strike.revokedAt) }}
        </span>
      </div>
    </div>

    <div class="actions">
      <XButton
        v-if="!strike.revokedAt"
        size="tiny"
        color="neutral"
        variant="soft"
        @click="$emit('revoke', strike)"
      >
        撤销
      </XButton>
    </div>
  </div>
</template>

<style scoped>
.strike-row {
  display: grid;
  grid-template-columns:
    86px minmax(120px, 220px) minmax(180px, 1fr)
    180px 52px;
  gap: 16px;
  align-items: center;
}

.summary,
.participants,
.details,
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
  width: 52px;
  flex: none;
  font-size: 12px;
}

.field-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metadata .field-label {
  width: 52px;
}

.strike-id {
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 767px) {
  .strike-row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px 10px;
  }

  .details {
    grid-column: 1;
    grid-row: 1;
  }

  .summary {
    grid-column: 2;
    grid-row: 1;
    align-items: flex-end;
  }

  .participants,
  .metadata {
    grid-column: 1 / -1;
  }

  .participants {
    grid-row: 2;
    flex-direction: row;
  }

  .metadata {
    grid-row: 3;
  }

  .actions {
    grid-column: 2;
    grid-row: 3;
    align-self: end;
  }

  .field {
    gap: 4px;
    font-size: 12px;
  }
}
</style>
