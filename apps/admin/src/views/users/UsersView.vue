<script setup lang="ts">
import { useAdminKit } from '@novelia/admin-kit';
import type { User, UserAction } from '@novelia/auth-api';
import { NAlert, NButton, NSpace, NText } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';

import {
  readCreatedRange,
  readPage,
  readPageSize,
  readQueryString,
  writeCreatedRange,
  writePagination,
} from '@/utils/listQuery';

import UserActionModal from './UserActionModal.vue';
import UserFilters from './UserFilters.vue';
import UserList from './UserList.vue';

const { api } = useAdminKit();
const route = useRoute();
const router = useRouter();
const users = ref<User[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);
const queryInput = ref('');
const roleInput = ref<string | null>(null);
const createdRangeInput = ref<[number, number] | null>(null);
const query = ref('');
const role = ref('');
const createdRange = ref<[number, number] | null>(null);
const pendingAction = ref<{ action: UserAction; user: User } | null>(null);
const actionSucceeded = ref('');
let requestId = 0;
const roles = new Set(['admin', 'trusted', 'member', 'restricted', 'banned']);
const hasFilters = computed(() =>
  Boolean(query.value || role.value || createdRange.value),
);

function getCreatedBounds(range: [number, number] | null) {
  if (!range) return {};

  const start = new Date(range[0]);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range[1]);
  end.setHours(24, 0, 0, 0);

  return {
    // The API uses strict greater-than/less-than comparisons. Subtracting one
    // second includes registrations made exactly at the start of the first day.
    createdAfter: Math.floor(start.getTime() / 1000) - 1,
    createdBefore: Math.floor(end.getTime() / 1000),
  };
}

function createQuery(options: {
  page: number;
  pageSize: number;
  query: string;
  role: string;
  createdRange: [number, number] | null;
}) {
  const nextQuery: LocationQueryRaw = {};
  if (options.query) nextQuery.query = options.query;
  if (options.role) nextQuery.role = options.role;
  writeCreatedRange(nextQuery, options.createdRange);
  writePagination(nextQuery, options.page, options.pageSize);
  return nextQuery;
}

function syncFromRoute() {
  page.value = readPage(route.query);
  pageSize.value = readPageSize(route.query);
  query.value = readQueryString(route.query, 'query').trim();
  const routeRole = readQueryString(route.query, 'role');
  role.value = roles.has(routeRole) ? routeRole : '';
  createdRange.value = readCreatedRange(route.query);

  queryInput.value = query.value;
  roleInput.value = role.value || null;
  createdRangeInput.value = createdRange.value ? [...createdRange.value] : null;
}

async function loadUsers() {
  const currentRequestId = ++requestId;
  loading.value = true;
  errorMessage.value = '';

  try {
    const data = await api.admin.getUsers({
      page: page.value,
      pageSize: pageSize.value,
      query: query.value,
      role: role.value,
      ...getCreatedBounds(createdRange.value),
    });

    if (currentRequestId !== requestId) return;
    users.value = data.items;
    total.value = data.total;
  } catch (error) {
    if (currentRequestId !== requestId) return;
    users.value = [];
    total.value = 0;
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    if (currentRequestId === requestId) loading.value = false;
  }
}

function search() {
  void router.push({
    query: createQuery({
      page: 1,
      pageSize: pageSize.value,
      query: queryInput.value.trim(),
      role: roleInput.value ?? '',
      createdRange: createdRangeInput.value,
    }),
  });
}

function resetFilters() {
  void router.push({
    query: createQuery({
      page: 1,
      pageSize: pageSize.value,
      query: '',
      role: '',
      createdRange: null,
    }),
  });
}

function changePage(nextPage: number) {
  void router.push({
    query: createQuery({
      page: nextPage,
      pageSize: pageSize.value,
      query: query.value,
      role: role.value,
      createdRange: createdRange.value,
    }),
  });
}

function changePageSize(nextPageSize: number) {
  void router.push({
    query: createQuery({
      page: 1,
      pageSize: nextPageSize,
      query: query.value,
      role: role.value,
      createdRange: createdRange.value,
    }),
  });
}

function requestAction(action: UserAction, user: User) {
  pendingAction.value = { action, user };
  actionSucceeded.value = '';
}

function closeActionModal() {
  pendingAction.value = null;
}

function handleActionSuccess(message: string) {
  pendingAction.value = null;
  actionSucceeded.value = message;
  void loadUsers();
}

watch(
  () => route.query,
  () => {
    syncFromRoute();
    void loadUsers();
  },
  { immediate: true },
);
</script>

<template>
  <n-space vertical :size="16" class="users-page">
    <UserFilters
      v-model:query="queryInput"
      v-model:role="roleInput"
      v-model:created-range="createdRangeInput"
      @search="search"
    />

    <n-alert v-if="errorMessage" type="error" title="用户列表加载失败">
      <n-space vertical size="small">
        <n-text>{{ errorMessage }}</n-text>
        <n-button size="small" @click="loadUsers">重新加载</n-button>
      </n-space>
    </n-alert>

    <n-alert
      v-if="actionSucceeded"
      type="success"
      closable
      @close="actionSucceeded = ''"
    >
      {{ actionSucceeded }}
    </n-alert>

    <UserList
      v-if="!errorMessage"
      :users="users"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :has-filters="hasFilters"
      @update-page="changePage"
      @update-page-size="changePageSize"
      @reset-filters="resetFilters"
      @action="requestAction"
    />

    <UserActionModal
      :target="pendingAction"
      @close="closeActionModal"
      @success="handleActionSuccess"
    />
  </n-space>
</template>

<style scoped>
.users-page {
  max-width: 1000px;
  margin-inline: auto;
}
</style>
