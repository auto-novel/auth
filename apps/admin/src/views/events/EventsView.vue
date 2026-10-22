<script setup lang="ts">
import { getApiErrorMessage, XButton } from '@novelia/web-kit';
import { NAlert } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';

import {
  readCreatedRange,
  readPage,
  readPageSize,
  readQueryString,
  readQueryStrings,
  writeCreatedRange,
  writePagination,
} from '@/utils/listQuery';
import { useAdminApi, type Event } from '@/api';

import EventFilters from './EventFilters.vue';
import EventList from './EventList.vue';

const api = useAdminApi();
const route = useRoute();
const router = useRouter();
const events = ref<Event[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);
const actorInput = ref('');
const targetInput = ref('');
const actionInput = ref<string[]>([]);
const createdRangeInput = ref<[number, number] | null>(null);
const actor = ref('');
const target = ref('');
const actions = ref<string[]>([]);
const createdRange = ref<[number, number] | null>(null);
let requestId = 0;
const hasFilters = computed(() =>
  Boolean(
    actor.value || target.value || actions.value.length || createdRange.value,
  ),
);

function createQuery(options: {
  page: number;
  pageSize: number;
  actor: string;
  target: string;
  actions: string[];
  createdRange: [number, number] | null;
}) {
  const query: LocationQueryRaw = {};
  if (options.actor) query.actor = options.actor;
  if (options.target) query.target = options.target;
  if (options.actions.length) query.action = options.actions;
  writeCreatedRange(query, options.createdRange);
  writePagination(query, options.page, options.pageSize);
  return query;
}

function syncFromRoute() {
  page.value = readPage(route.query);
  pageSize.value = readPageSize(route.query);
  actor.value = readQueryString(route.query, 'actor').trim();
  target.value = readQueryString(route.query, 'target').trim();
  actions.value = readQueryStrings(route.query, 'action');
  createdRange.value = readCreatedRange(route.query);

  actorInput.value = actor.value;
  targetInput.value = target.value;
  actionInput.value = [...actions.value];
  createdRangeInput.value = createdRange.value ? [...createdRange.value] : null;
}

function getCreatedBounds(range: [number, number] | null) {
  if (!range) return {};

  const start = new Date(range[0]);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range[1]);
  end.setHours(24, 0, 0, 0);

  return {
    createdAfter: Math.floor(start.getTime() / 1000) - 1,
    createdBefore: Math.floor(end.getTime() / 1000),
  };
}

async function loadEvents() {
  const currentRequestId = ++requestId;
  loading.value = true;
  errorMessage.value = '';

  try {
    const data = await api.admin.getEvents({
      page: page.value,
      pageSize: pageSize.value,
      actorUser: actor.value,
      targetUser: target.value,
      actions: actions.value,
      ...getCreatedBounds(createdRange.value),
    });

    if (currentRequestId !== requestId) return;
    events.value = data.items;
    total.value = data.total;
  } catch (error) {
    if (currentRequestId !== requestId) return;
    events.value = [];
    total.value = 0;
    errorMessage.value = getApiErrorMessage(error, '无法加载事件列表');
  } finally {
    if (currentRequestId === requestId) loading.value = false;
  }
}

function search() {
  void router.push({
    query: createQuery({
      page: 1,
      pageSize: pageSize.value,
      actor: actorInput.value.trim(),
      target: targetInput.value.trim(),
      actions: actionInput.value,
      createdRange: createdRangeInput.value,
    }),
  });
}

function resetFilters() {
  void router.push({
    query: createQuery({
      page: 1,
      pageSize: pageSize.value,
      actor: '',
      target: '',
      actions: [],
      createdRange: null,
    }),
  });
}

function changePage(nextPage: number) {
  void router.push({
    query: createQuery({
      page: nextPage,
      pageSize: pageSize.value,
      actor: actor.value,
      target: target.value,
      actions: actions.value,
      createdRange: createdRange.value,
    }),
  });
}

function changePageSize(nextPageSize: number) {
  void router.push({
    query: createQuery({
      page: 1,
      pageSize: nextPageSize,
      actor: actor.value,
      target: target.value,
      actions: actions.value,
      createdRange: createdRange.value,
    }),
  });
}

watch(
  () => route.query,
  () => {
    syncFromRoute();
    void loadEvents();
  },
  { immediate: true },
);
</script>

<template>
  <div class="events-page flex flex-col gap-4">
    <EventFilters
      v-model:actor="actorInput"
      v-model:target="targetInput"
      v-model:action="actionInput"
      v-model:created-range="createdRangeInput"
      @search="search"
    />

    <n-alert v-if="errorMessage" type="error" title="事件列表加载失败">
      <div class="flex flex-col gap-2">
        <span class="text-ink">{{ errorMessage }}</span>
        <XButton
          class="self-start"
          color="neutral"
          variant="outline"
          size="sm"
          @click="loadEvents"
        >
          重新加载
        </XButton>
      </div>
    </n-alert>

    <EventList
      v-if="!errorMessage"
      :events="events"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :has-filters="hasFilters"
      @update-page="changePage"
      @update-page-size="changePageSize"
      @reset-filters="resetFilters"
    />
  </div>
</template>

<style scoped>
.events-page {
  max-width: 1000px;
  margin-inline: auto;
}
</style>
