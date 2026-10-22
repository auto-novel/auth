<script setup lang="ts">
import {
  getApiErrorMessage,
  Toast,
  XButton,
  XDialog,
  XInput,
} from '@novelia/web-kit';
import { NAlert, NForm, NFormItem, NInput, NInputNumber } from 'naive-ui';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';

import { useAdminApi, type Strike } from '@/api';

import {
  readCreatedRange,
  readPage,
  readPageSize,
  readQueryString,
  writeCreatedRange,
  writePagination,
} from '@/utils/listQuery';

import StrikeFilters from './StrikeFilters.vue';
import StrikeList from './StrikeList.vue';

const api = useAdminApi();
const route = useRoute();
const router = useRouter();
const strikes = ref<Strike[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);
const usernameInput = ref('');
const operatorUsernameInput = ref('');
const createdRangeInput = ref<[number, number] | null>(null);
const username = ref('');
const operatorUsername = ref('');
const createdRange = ref<[number, number] | null>(null);
const showCreateModal = ref(false);
const createInProgress = ref(false);
const createForm = reactive({
  username: '',
  reason: '',
  evidence: '',
  point: 1,
});
const pendingRevoke = ref<Strike | null>(null);
const revokeInProgress = ref(false);
let requestId = 0;

const hasFilters = computed(() =>
  Boolean(username.value || operatorUsername.value || createdRange.value),
);
const canCreate = computed(() =>
  Boolean(
    createForm.username.trim() &&
    createForm.reason.trim() &&
    createForm.evidence.trim() &&
    createForm.point > 0,
  ),
);
const showRevokeModal = computed({
  get: () => pendingRevoke.value !== null,
  set: (show) => {
    if (!show && !revokeInProgress.value) pendingRevoke.value = null;
  },
});

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

function createQuery(options: {
  page: number;
  pageSize: number;
  username: string;
  operatorUsername: string;
  createdRange: [number, number] | null;
}) {
  const query: LocationQueryRaw = {};
  if (options.username) query.username = options.username;
  if (options.operatorUsername) {
    query.operatorUsername = options.operatorUsername;
  }
  writeCreatedRange(query, options.createdRange);
  writePagination(query, options.page, options.pageSize);
  return query;
}

function syncFromRoute() {
  page.value = readPage(route.query);
  pageSize.value = readPageSize(route.query);
  username.value = readQueryString(route.query, 'username').trim();
  operatorUsername.value = readQueryString(
    route.query,
    'operatorUsername',
  ).trim();
  createdRange.value = readCreatedRange(route.query);

  usernameInput.value = username.value;
  operatorUsernameInput.value = operatorUsername.value;
  createdRangeInput.value = createdRange.value ? [...createdRange.value] : null;
}

async function loadStrikes() {
  const currentRequestId = ++requestId;
  loading.value = true;
  errorMessage.value = '';
  try {
    const data = await api.admin.getStrikes({
      page: page.value,
      pageSize: pageSize.value,
      username: username.value,
      operatorUsername: operatorUsername.value,
      ...getCreatedBounds(createdRange.value),
    });
    if (currentRequestId !== requestId) return;
    strikes.value = data.items;
    total.value = data.total;
  } catch (error) {
    if (currentRequestId !== requestId) return;
    strikes.value = [];
    total.value = 0;
    errorMessage.value = getApiErrorMessage(error, '无法加载处罚记录');
  } finally {
    if (currentRequestId === requestId) loading.value = false;
  }
}

function search() {
  void router.push({
    query: createQuery({
      page: 1,
      pageSize: pageSize.value,
      username: usernameInput.value.trim(),
      operatorUsername: operatorUsernameInput.value.trim(),
      createdRange: createdRangeInput.value,
    }),
  });
}

function resetFilters() {
  void router.push({
    query: createQuery({
      page: 1,
      pageSize: pageSize.value,
      username: '',
      operatorUsername: '',
      createdRange: null,
    }),
  });
}

function changePage(nextPage: number) {
  void router.push({
    query: createQuery({
      page: nextPage,
      pageSize: pageSize.value,
      username: username.value,
      operatorUsername: operatorUsername.value,
      createdRange: createdRange.value,
    }),
  });
}

function changePageSize(nextPageSize: number) {
  void router.push({
    query: createQuery({
      page: 1,
      pageSize: nextPageSize,
      username: username.value,
      operatorUsername: operatorUsername.value,
      createdRange: createdRange.value,
    }),
  });
}

function openCreateModal() {
  if (createInProgress.value) return;
  Object.assign(createForm, {
    username: '',
    reason: '',
    evidence: '',
    point: 1,
  });
  showCreateModal.value = true;
}

function closeCreateModal() {
  if (!createInProgress.value) showCreateModal.value = false;
}

async function submitCreate() {
  if (createInProgress.value || !canCreate.value) return;
  createInProgress.value = true;
  await Toast.promise(
    api.admin
      .createStrike({
        username: createForm.username.trim(),
        reason: createForm.reason.trim(),
        evidence: createForm.evidence.trim(),
        point: createForm.point,
      })
      .then(async () => {
        showCreateModal.value = false;
        const firstPageLocation = {
          query: createQuery({
            page: 1,
            pageSize: pageSize.value,
            username: username.value,
            operatorUsername: operatorUsername.value,
            createdRange: createdRange.value,
          }),
        };
        if (router.resolve(firstPageLocation).fullPath === route.fullPath) {
          await loadStrikes();
        } else {
          await router.push(firstPageLocation);
        }
      }),
    {
      loading: '正在新增警告',
      success: `已警告用户 ${createForm.username.trim()}`,
      error: '新增警告失败',
    },
  ).finally(() => {
    createInProgress.value = false;
  });
}

function requestRevoke(strike: Strike) {
  if (revokeInProgress.value) return;
  pendingRevoke.value = strike;
}

async function confirmRevoke() {
  if (revokeInProgress.value || !pendingRevoke.value) return;
  revokeInProgress.value = true;
  await Toast.promise(
    api.admin.revokeStrike(pendingRevoke.value.id).then(async () => {
      pendingRevoke.value = null;
      await loadStrikes();
    }),
    {
      loading: '正在撤销违规记录',
      success: `已撤销违规记录 #${pendingRevoke.value.id}`,
      error: '撤销失败',
    },
  ).finally(() => {
    revokeInProgress.value = false;
  });
}

watch(
  () => route.query,
  () => {
    syncFromRoute();
    void loadStrikes();
  },
  { immediate: true },
);
</script>

<template>
  <div class="strikes-page flex flex-col gap-4">
    <StrikeFilters
      v-model:username="usernameInput"
      v-model:operator-username="operatorUsernameInput"
      v-model:created-range="createdRangeInput"
      @search="search"
      @create="openCreateModal"
    />

    <n-alert v-if="errorMessage" type="error" title="违规记录加载失败">
      <div class="flex flex-col gap-2">
        <span class="text-ink">{{ errorMessage }}</span>
        <XButton
          class="self-start"
          color="neutral"
          variant="outline"
          size="sm"
          @click="loadStrikes"
        >
          重新加载
        </XButton>
      </div>
    </n-alert>

    <StrikeList
      v-if="!errorMessage"
      :strikes="strikes"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :has-filters="hasFilters"
      @update-page="changePage"
      @update-page-size="changePageSize"
      @reset-filters="resetFilters"
      @revoke="requestRevoke"
    />

    <XDialog
      :open="showCreateModal"
      title="新增警告"
      class="w-[560px]"
      :closable="!createInProgress"
      @update:open="(open) => !open && closeCreateModal()"
    >
      <n-form label-placement="top" :show-feedback="false">
        <div class="flex flex-col gap-4">
          <n-form-item label="目标用户名" required>
            <XInput
              v-model="createForm.username"
              class="w-full"
              placeholder="仅可警告普通用户"
              :disabled="createInProgress"
            />
          </n-form-item>
          <n-form-item label="原因" required>
            <n-input
              v-model:value="createForm.reason"
              type="textarea"
              placeholder="说明违规原因"
              :autosize="{ minRows: 2, maxRows: 5 }"
              :disabled="createInProgress"
              maxlength="500"
              show-count
            />
          </n-form-item>
          <n-form-item label="证据" required>
            <n-input
              v-model:value="createForm.evidence"
              type="textarea"
              placeholder="填写证据说明或链接"
              :autosize="{ minRows: 2, maxRows: 5 }"
              :disabled="createInProgress"
              maxlength="1000"
              show-count
            />
          </n-form-item>
          <n-form-item label="扣分" required>
            <n-input-number
              v-model:value="createForm.point"
              :min="1"
              :max="32767"
              :precision="0"
              :disabled="createInProgress"
            />
          </n-form-item>
          <n-alert type="warning" :bordered="false">
            用户在 100 天内累计达到 3 分后，将自动转为受限用户。
          </n-alert>
          <div class="modal-actions">
            <XButton
              color="neutral"
              variant="outline"
              :disabled="createInProgress"
              @click="closeCreateModal"
            >
              取消
            </XButton>
            <XButton
              color="warning"
              :loading="createInProgress"
              :disabled="!canCreate"
              @click="submitCreate"
            >
              确认警告
            </XButton>
          </div>
        </div>
      </n-form>
    </XDialog>

    <XDialog
      v-model:open="showRevokeModal"
      title="撤销违规记录"
      class="w-[500px]"
      :closable="!revokeInProgress"
    >
      <div class="flex flex-col gap-4">
        <p class="m-0 text-ink">
          确认撤销记录
          <strong class="text-ink">#{{ pendingRevoke?.id }}</strong>
          ？撤销后该记录的分数将不再计入处罚统计。
        </p>
        <div class="modal-actions">
          <XButton
            color="neutral"
            variant="outline"
            :disabled="revokeInProgress"
            @click="showRevokeModal = false"
          >
            取消
          </XButton>
          <XButton
            color="warning"
            :loading="revokeInProgress"
            @click="confirmRevoke"
          >
            确认撤销
          </XButton>
        </div>
      </div>
    </XDialog>
  </div>
</template>

<style scoped>
.strikes-page {
  max-width: 1000px;
  margin-inline: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.n-form-item-blank) {
  min-height: auto;
}
</style>
