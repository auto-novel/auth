<script setup lang="ts">
import {
  NButton,
  NCard,
  NEmpty,
  NList,
  NListItem,
  NPagination,
  NSelect,
  NSkeleton,
  NSpin,
  NText,
  type SelectOption,
} from 'naive-ui';
import { computed } from 'vue';

import type { Event } from '@novelia/auth-api';

import EventListItem from './EventListItem.vue';

const props = defineProps<{
  events: Event[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  hasFilters: boolean;
}>();
const emit = defineEmits<{
  updatePage: [page: number];
  updatePageSize: [pageSize: number];
  resetFilters: [];
}>();

const pageSizeOptions: SelectOption[] = [
  { label: '20 条/页', value: 20 },
  { label: '50 条/页', value: 50 },
  { label: '100 条/页', value: 100 },
];

const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.total / props.pageSize)),
);
const rangeStart = computed(() =>
  props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1,
);
const rangeEnd = computed(() =>
  Math.min(props.page * props.pageSize, props.total),
);

function changePageSize(value: string | number | null) {
  if (typeof value === 'number') emit('updatePageSize', value);
}
</script>

<template>
  <div class="event-list">
    <div v-if="!loading || events.length" class="list-summary">
      <n-text depth="3">
        <template v-if="total">
          显示 {{ rangeStart }}–{{ rangeEnd }}，共 {{ total }} 条事件
        </template>
        <template v-else>共 0 条事件</template>
      </n-text>
      <n-select
        class="page-size-select"
        size="small"
        :value="pageSize"
        :options="pageSizeOptions"
        aria-label="每页显示数量"
        @update:value="changePageSize"
      />
    </div>

    <n-card class="list-card" content-style="padding: 0;">
      <div v-if="loading && !events.length" class="skeleton-list">
        <div v-for="index in 6" :key="index" class="skeleton-row">
          <n-skeleton text :repeat="2" />
        </div>
      </div>
      <n-spin v-else :show="loading">
        <n-list v-if="events.length">
          <n-list-item v-for="event in events" :key="event.id">
            <EventListItem :event="event" :total="total" />
          </n-list-item>
        </n-list>
        <n-empty
          v-else
          class="empty"
          :description="hasFilters ? '未找到符合条件的事件' : '暂无事件'"
        >
          <template v-if="hasFilters" #extra>
            <n-button size="small" @click="emit('resetFilters')">
              清除筛选
            </n-button>
          </template>
        </n-empty>
      </n-spin>
    </n-card>

    <div v-if="total > pageSize" class="pagination">
      <n-pagination
        :page="page"
        :page-count="pageCount"
        :page-slot="5"
        show-quick-jumper
        @update:page="emit('updatePage', $event)"
      >
        <template #goto>跳至</template>
      </n-pagination>
    </div>
  </div>
</template>

<style scoped>
.event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-summary {
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-size-select {
  width: 112px;
  flex: none;
}

.list-card {
  border-right: 0;
  border-left: 0;
}

.skeleton-list {
  padding: 0 16px;
}

.skeleton-row {
  padding: 12px 0;
}

.skeleton-row + .skeleton-row {
  border-top: 1px solid var(--n-border-color);
}

:deep(.n-list-item) {
  padding: 9px 16px;
}

.empty {
  padding: 64px 16px;
}

.pagination {
  display: flex;
  overflow-x: auto;
}

@media (max-width: 767px) {
  :deep(.n-list-item) {
    padding: 8px 10px;
  }

  .skeleton-list {
    padding-inline: 10px;
  }
}
</style>
