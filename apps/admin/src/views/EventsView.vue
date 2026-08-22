<script setup lang="ts">
import { useAdminKit } from '@novelia/admin-kit';
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NEmpty,
  NInput,
  NPagination,
  NSelect,
  NSpace,
  NTag,
  NText,
  type DataTableColumns,
  type SelectOption,
} from 'naive-ui';
import { computed, h, onMounted, ref } from 'vue';

import { getEvents, type Event } from '@/data/events';

interface EventDetail {
  actor_user?: string;
  target_user?: string;
  [key: string]: unknown;
}

const { session } = useAdminKit();
const events = ref<Event[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);

const actorInput = ref('');
const targetInput = ref('');
const actionInput = ref<string | null>(null);
const createdRangeInput = ref<[number, number] | null>(null);
const actor = ref('');
const target = ref('');
const action = ref('');
const createdRange = ref<[number, number] | null>(null);
let requestId = 0;

const actionLabels: Record<string, string> = {
  login: '登录',
  register: '注册',
  logout: '退出登录',
  otp: '发送验证码',
  reset_password: '重置密码',
  'restrict-user': '限制用户',
  'ban-user': '封禁用户',
  'strike-user': '警告用户',
};

const actionTypes: Record<
  string,
  'default' | 'success' | 'warning' | 'error' | 'info'
> = {
  login: 'success',
  register: 'info',
  logout: 'default',
  otp: 'info',
  reset_password: 'warning',
  'restrict-user': 'warning',
  'ban-user': 'error',
  'strike-user': 'warning',
};

const actionOptions: SelectOption[] = Object.entries(actionLabels).map(
  ([value, label]) => ({ value, label }),
);
const pageSizeOptions: SelectOption[] = [
  { label: '20 条/页', value: 20 },
  { label: '50 条/页', value: 50 },
  { label: '100 条/页', value: 100 },
];

const hasFilters = computed(() =>
  Boolean(actor.value || target.value || action.value || createdRange.value),
);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize.value)),
);
const rangeStart = computed(() =>
  total.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1,
);
const rangeEnd = computed(() =>
  Math.min(page.value * pageSize.value, total.value),
);

function parseDetail(detail: string): EventDetail {
  try {
    const value: unknown = JSON.parse(detail);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as EventDetail;
    }
  } catch {
    // Keep malformed legacy details visible in the detail column.
  }
  return {};
}

function formatDetail(detail: string) {
  try {
    return JSON.stringify(JSON.parse(detail), null, 2);
  } catch {
    return detail || '—';
  }
}

function formatDate(value: string) {
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

const columns: DataTableColumns<Event> = [
  {
    title: 'ID',
    key: 'id',
    width: 84,
    render: (event) => h(NText, { depth: 3 }, { default: () => `#${event.id}` }),
  },
  {
    title: '事件',
    key: 'action',
    width: 130,
    render: (event) =>
      h(
        NTag,
        {
          size: 'small',
          bordered: false,
          type: actionTypes[event.action] ?? 'default',
        },
        { default: () => actionLabels[event.action] ?? event.action },
      ),
  },
  {
    title: '操作者',
    key: 'actorUser',
    width: 150,
    ellipsis: { tooltip: true },
    render: (event) => parseDetail(event.detail).actor_user || '—',
  },
  {
    title: '目标用户',
    key: 'targetUser',
    width: 150,
    ellipsis: { tooltip: true },
    render: (event) => parseDetail(event.detail).target_user || '—',
  },
  {
    title: '详情',
    key: 'detail',
    minWidth: 260,
    ellipsis: { tooltip: true },
    render: (event) => formatDetail(event.detail).replace(/\n/g, ' '),
  },
  {
    title: '发生时间',
    key: 'createdAt',
    width: 180,
    render: (event) => formatDate(event.createdAt),
  },
];

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
      action: action.value,
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
  action.value = actionInput.value ?? '';
  createdRange.value = createdRangeInput.value
    ? [...createdRangeInput.value]
    : null;
  page.value = 1;
  void loadEvents();
}

function resetFilters() {
  actorInput.value = '';
  targetInput.value = '';
  actionInput.value = null;
  createdRangeInput.value = null;
  actor.value = '';
  target.value = '';
  action.value = '';
  createdRange.value = null;
  page.value = 1;
  void loadEvents();
}

function changePage(nextPage: number) {
  page.value = nextPage;
  void loadEvents();
}

function changePageSize(value: string | number | null) {
  if (typeof value !== 'number') return;
  pageSize.value = value;
  page.value = 1;
  void loadEvents();
}

onMounted(loadEvents);
</script>

<template>
  <n-space vertical :size="16" class="events-page">
    <div class="filters">
      <n-input
        v-model:value="actorInput"
        clearable
        placeholder="操作者用户名"
        @keyup.enter="search"
      />
      <n-input
        v-model:value="targetInput"
        clearable
        placeholder="目标用户名"
        @keyup.enter="search"
      />
      <n-select
        v-model:value="actionInput"
        clearable
        :options="actionOptions"
        placeholder="全部事件"
      />
      <n-date-picker
        v-model:value="createdRangeInput"
        type="daterange"
        clearable
        start-placeholder="开始日期"
        end-placeholder="结束日期"
      />
      <n-button type="primary" @click="search">查询</n-button>
    </div>

    <n-alert v-if="errorMessage" type="error" title="事件列表加载失败">
      <n-space vertical size="small">
        <n-text>{{ errorMessage }}</n-text>
        <n-button size="small" @click="loadEvents">重新加载</n-button>
      </n-space>
    </n-alert>

    <template v-else>
      <div class="list-summary">
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

      <n-card content-style="padding: 0;">
        <n-data-table
          v-if="loading || events.length"
          :columns="columns"
          :data="events"
          :loading="loading"
          :row-key="(event: Event) => event.id"
          :scroll-x="954"
          :bordered="false"
        />
        <n-empty
          v-else
          class="empty"
          :description="hasFilters ? '未找到符合条件的事件' : '暂无事件'"
        >
          <template v-if="hasFilters" #extra>
            <n-button size="small" @click="resetFilters">清除筛选</n-button>
          </template>
        </n-empty>
      </n-card>

      <div v-if="total > pageSize" class="pagination">
        <n-pagination
          :page="page"
          :page-count="pageCount"
          :page-slot="5"
          show-quick-jumper
          @update:page="changePage"
        >
          <template #goto>跳至</template>
        </n-pagination>
      </div>
    </template>
  </n-space>
</template>

<style scoped>
.events-page {
  max-width: 1200px;
  margin-inline: auto;
}

.filters {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(150px, 1fr) 160px 300px auto;
  gap: 12px;
  align-items: center;
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

.empty {
  padding: 64px 16px;
}

.pagination {
  display: flex;
  overflow-x: auto;
}

@media (max-width: 1050px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  }

  .filters :deep(.n-date-picker) {
    grid-column: 1 / 3;
  }
}

@media (max-width: 767px) {
  .filters {
    grid-template-columns: minmax(0, 1fr);
  }

  .filters :deep(.n-date-picker) {
    grid-column: auto;
  }
}
</style>
