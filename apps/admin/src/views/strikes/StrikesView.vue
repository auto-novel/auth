<script setup lang="ts">
import { useAdminKit } from '@novelia/admin-kit';
import type { Strike } from '@novelia/auth-api';
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSpace,
  NText,
} from 'naive-ui';
import { computed, onMounted, reactive, ref } from 'vue';

import StrikeFilters from './StrikeFilters.vue';
import StrikeList from './StrikeList.vue';

const { api } = useAdminKit();
const strikes = ref<Strike[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
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
const createError = ref('');
const createForm = reactive({
  username: '',
  reason: '',
  evidence: '',
  point: 1,
});
const pendingRevoke = ref<Strike | null>(null);
const revokeInProgress = ref(false);
const revokeError = ref('');
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
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    if (currentRequestId === requestId) loading.value = false;
  }
}

function search() {
  username.value = usernameInput.value.trim();
  operatorUsername.value = operatorUsernameInput.value.trim();
  createdRange.value = createdRangeInput.value
    ? [...createdRangeInput.value]
    : null;
  page.value = 1;
  void loadStrikes();
}

function resetFilters() {
  usernameInput.value = '';
  operatorUsernameInput.value = '';
  createdRangeInput.value = null;
  username.value = '';
  operatorUsername.value = '';
  createdRange.value = null;
  page.value = 1;
  void loadStrikes();
}

function changePage(nextPage: number) {
  page.value = nextPage;
  void loadStrikes();
}

function changePageSize(nextPageSize: number) {
  pageSize.value = nextPageSize;
  page.value = 1;
  void loadStrikes();
}

function openCreateModal() {
  Object.assign(createForm, {
    username: '',
    reason: '',
    evidence: '',
    point: 1,
  });
  createError.value = '';
  showCreateModal.value = true;
}

function closeCreateModal() {
  if (!createInProgress.value) showCreateModal.value = false;
}

async function submitCreate() {
  if (!canCreate.value) return;
  createInProgress.value = true;
  createError.value = '';
  try {
    await api.admin.createStrike({
      username: createForm.username.trim(),
      reason: createForm.reason.trim(),
      evidence: createForm.evidence.trim(),
      point: createForm.point,
    });
    showCreateModal.value = false;
    successMessage.value = `已警告用户 ${createForm.username.trim()}`;
    page.value = 1;
    await loadStrikes();
  } catch (error) {
    createError.value = error instanceof Error ? error.message : String(error);
  } finally {
    createInProgress.value = false;
  }
}

function requestRevoke(strike: Strike) {
  pendingRevoke.value = strike;
  revokeError.value = '';
}

async function confirmRevoke() {
  if (!pendingRevoke.value) return;
  revokeInProgress.value = true;
  revokeError.value = '';
  try {
    await api.admin.revokeStrike(pendingRevoke.value.id);
    successMessage.value = `已撤销违规记录 #${pendingRevoke.value.id}`;
    pendingRevoke.value = null;
    await loadStrikes();
  } catch (error) {
    revokeError.value = error instanceof Error ? error.message : String(error);
  } finally {
    revokeInProgress.value = false;
  }
}

onMounted(loadStrikes);
</script>

<template>
  <n-space vertical :size="16" class="strikes-page">
    <StrikeFilters
      v-model:username="usernameInput"
      v-model:operator-username="operatorUsernameInput"
      v-model:created-range="createdRangeInput"
      @search="search"
      @create="openCreateModal"
    />

    <n-alert v-if="errorMessage" type="error" title="违规记录加载失败">
      <n-space vertical size="small">
        <n-text>{{ errorMessage }}</n-text>
        <n-button size="small" @click="loadStrikes">重新加载</n-button>
      </n-space>
    </n-alert>
    <n-alert
      v-if="successMessage"
      type="success"
      closable
      @close="successMessage = ''"
    >
      {{ successMessage }}
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

    <n-modal
      v-model:show="showCreateModal"
      preset="card"
      title="新增警告"
      style="width: min(560px, calc(100vw - 32px))"
      :mask-closable="!createInProgress"
      :close-on-esc="!createInProgress"
    >
      <n-form label-placement="top" :show-feedback="false">
        <n-space vertical :size="16">
          <n-form-item label="目标用户名" required>
            <n-input
              v-model:value="createForm.username"
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
          <n-alert v-if="createError" type="error" title="新增警告失败">
            {{ createError }}
          </n-alert>
          <div class="modal-actions">
            <n-button :disabled="createInProgress" @click="closeCreateModal">
              取消
            </n-button>
            <n-button
              type="warning"
              :loading="createInProgress"
              :disabled="!canCreate"
              @click="submitCreate"
            >
              确认警告
            </n-button>
          </div>
        </n-space>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="showRevokeModal"
      preset="card"
      title="撤销违规记录"
      style="width: min(500px, calc(100vw - 32px))"
      :mask-closable="!revokeInProgress"
      :close-on-esc="!revokeInProgress"
    >
      <n-space vertical :size="16">
        <n-text>
          确认撤销记录
          <n-text strong>#{{ pendingRevoke?.id }}</n-text>
          ？撤销后该记录的分数将不再计入处罚统计。
        </n-text>
        <n-alert v-if="revokeError" type="error" title="撤销失败">
          {{ revokeError }}
        </n-alert>
        <div class="modal-actions">
          <n-button
            :disabled="revokeInProgress"
            @click="showRevokeModal = false"
          >
            取消
          </n-button>
          <n-button
            type="warning"
            :loading="revokeInProgress"
            @click="confirmRevoke"
          >
            确认撤销
          </n-button>
        </div>
      </n-space>
    </n-modal>
  </n-space>
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
