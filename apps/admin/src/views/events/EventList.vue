<script setup lang="ts">
import { XButton, XPagination, XSelect } from '@novelia/web-kit';
import { NCard, NEmpty, NSkeleton, NSpin } from 'naive-ui';
import { computed } from 'vue';

import type { Event } from '@/api';

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

const pageSizeOptions = [
  { label: '20 条/页', value: '20' },
  { label: '50 条/页', value: '50' },
  { label: '100 条/页', value: '100' },
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

function changePageSize(value: string) {
  emit('updatePageSize', Number(value));
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-if="!loading || events.length"
      class="flex min-h-7 items-center justify-between gap-3"
    >
      <span class="text-muted">
        <template v-if="total">
          显示 {{ rangeStart }}–{{ rangeEnd }}，共 {{ total }} 条事件
        </template>
        <template v-else>共 0 条事件</template>
      </span>
      <XSelect
        class="page-size-select"
        :model-value="String(pageSize)"
        :options="pageSizeOptions"
        aria-label="每页显示数量"
        @update:model-value="changePageSize"
      />
    </div>

    <n-card class="list-card" content-style="padding: 0;">
      <div
        v-if="loading && !events.length"
        class="px-4 [@media(max-width:767px)]:px-2.5"
      >
        <div v-for="index in 6" :key="index" class="skeleton-row py-3">
          <n-skeleton text :repeat="2" />
        </div>
      </div>
      <n-spin v-else :show="loading">
        <ul
          v-if="events.length"
          class="record-list bg-surface text-ink"
          role="list"
        >
          <li v-for="event in events" :key="event.id" class="record-item">
            <EventListItem :event="event" :total="total" />
          </li>
        </ul>
        <n-empty
          v-else
          class="empty"
          :description="hasFilters ? '未找到符合条件的事件' : '暂无事件'"
        >
          <template v-if="hasFilters" #extra>
            <XButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="emit('resetFilters')"
            >
              清除筛选
            </XButton>
          </template>
        </n-empty>
      </n-spin>
    </n-card>

    <div v-if="total > pageSize" class="flex overflow-x-auto">
      <XPagination
        class="w-full"
        :page="page"
        :total-pages="pageCount"
        @update:page="emit('updatePage', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.page-size-select {
  width: 112px;
  flex: none;
}

.list-card {
  border-right: 0;
  border-left: 0;
}

.record-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.skeleton-row + .skeleton-row,
.record-item + .record-item {
  border-top: 1px solid var(--color-divider);
}

.record-item {
  padding: 9px 16px;
}

.empty {
  padding: 64px 16px;
}

@media (max-width: 767px) {
  .record-item {
    padding: 8px 10px;
  }
}
</style>
