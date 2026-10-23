<script setup lang="ts">
import { XAsyncContent, XButton, XPagination, XSelect } from '@novelia/web-kit';
import { Inventory2Outlined } from '@vicons/material';
import { computed } from 'vue';

import type { User, UserAction } from '@/api';

import UserListItem from './UserListItem.vue';

const props = defineProps<{
  users: User[];
  loading: boolean;
  error: string;
  total: number;
  page: number;
  pageSize: number;
  hasFilters: boolean;
}>();
const emit = defineEmits<{
  updatePage: [page: number];
  updatePageSize: [pageSize: number];
  resetFilters: [];
  retry: [];
  action: [action: UserAction, user: User];
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

function forwardAction(action: UserAction, user: User) {
  emit('action', action, user);
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-if="!error && (!loading || users.length)"
      class="flex min-h-7 items-center justify-between gap-3"
    >
      <span class="flex items-center gap-2 text-muted">
        <span
          v-if="loading"
          class="size-3 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          aria-hidden="true"
        />
        <template v-if="total">
          显示 {{ rangeStart }}–{{ rangeEnd }}，共 {{ total }} 位用户
        </template>
        <template v-else>共 0 位用户</template>
      </span>
      <XSelect
        class="w-[112px]"
        :model-value="String(pageSize)"
        :options="pageSizeOptions"
        aria-label="每页显示数量"
        @update:model-value="changePageSize"
      />
    </div>

    <div class="list-card rounded-[3px] border-y border-divider bg-surface">
      <XAsyncContent
        :loading="loading && !users.length"
        :error="error"
        :empty="!loading && !error && !users.length"
        error-title="用户列表加载失败"
        retry-label="重新加载"
        :on-retry="() => emit('retry')"
      >
        <template #loading>
          <div class="px-4 [@media(max-width:767px)]:px-2.5" role="status">
            <span class="sr-only">正在加载用户列表…</span>
            <div
              v-for="index in 6"
              :key="index"
              class="skeleton-row flex flex-col gap-2 py-3"
              aria-hidden="true"
            >
              <div class="skeleton h-3.5 w-full" />
              <div class="skeleton h-3.5 w-3/5" />
            </div>
          </div>
        </template>
        <template #empty>
          <div class="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <span
              class="grid size-12 place-items-center rounded-full bg-paper text-muted"
              aria-hidden="true"
            >
              <Inventory2Outlined class="size-6" />
            </span>
            <p class="m-0 text-sm text-muted">
              {{ hasFilters ? '未找到符合条件的用户' : '暂无用户' }}
            </p>
            <XButton
              v-if="hasFilters"
              color="neutral"
              variant="outline"
              size="sm"
              @click="emit('resetFilters')"
            >
              清除筛选
            </XButton>
          </div>
        </template>
        <ul
          v-if="users.length"
          class="record-list text-ink"
          role="list"
          :aria-busy="loading"
        >
          <li v-for="user in users" :key="user.id" class="record-item">
            <UserListItem :user="user" :total="total" @action="forwardAction" />
          </li>
        </ul>
      </XAsyncContent>
    </div>

    <div v-if="!error && total > pageSize" class="flex overflow-x-auto">
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

@media (max-width: 767px) {
  .record-item {
    padding: 8px 10px;
  }
}
</style>
