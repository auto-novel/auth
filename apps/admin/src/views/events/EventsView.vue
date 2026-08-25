<script setup lang="ts">
import { useAdminKit } from '@novelia/admin-kit';
import { NAlert, NButton, NSpace, NText } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';

import { getEvents, type Event } from '@/data/events';

import EventFilters from './EventFilters.vue';
import EventList from './EventList.vue';

const { session } = useAdminKit();
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
    const data = await getEvents(session, {
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
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    if (currentRequestId === requestId) loading.value = false;
  }
}

function search() {
  actor.value = actorInput.value.trim();
  target.value = targetInput.value.trim();
  actions.value = [...actionInput.value];
  createdRange.value = createdRangeInput.value
    ? [...createdRangeInput.value]
    : null;
  page.value = 1;
  void loadEvents();
}

function resetFilters() {
  actorInput.value = '';
  targetInput.value = '';
  actionInput.value = [];
  createdRangeInput.value = null;
  actor.value = '';
  target.value = '';
  actions.value = [];
  createdRange.value = null;
  page.value = 1;
  void loadEvents();
}

function changePage(nextPage: number) {
  page.value = nextPage;
  void loadEvents();
}

function changePageSize(nextPageSize: number) {
  pageSize.value = nextPageSize;
  page.value = 1;
  void loadEvents();
}

onMounted(loadEvents);
</script>

<template>
  <n-space vertical :size="16" class="events-page">
    <EventFilters
      v-model:actor="actorInput"
      v-model:target="targetInput"
      v-model:action="actionInput"
      v-model:created-range="createdRangeInput"
      @search="search"
    />

    <n-alert v-if="errorMessage" type="error" title="事件列表加载失败">
      <n-space vertical size="small">
        <n-text>{{ errorMessage }}</n-text>
        <n-button size="small" @click="loadEvents">重新加载</n-button>
      </n-space>
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
  </n-space>
</template>

<style scoped>
.events-page {
  max-width: 1000px;
  margin-inline: auto;
}
</style>
