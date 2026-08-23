<script setup lang="ts">
import { useAdminKit } from '@novelia/admin-kit';
import { NAlert, NButton, NInput, NModal, NSpace, NText } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';

import {
  getUsers,
  updateUserRole,
  type User,
  type UserAction,
} from '@/data/users';

import UserFilters from './UserFilters.vue';
import UserList from './UserList.vue';

const { session } = useAdminKit();
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
const actionReason = ref('');
const actionInProgress = ref(false);
const actionError = ref('');
const actionSucceeded = ref('');
let requestId = 0;
const hasFilters = computed(() =>
  Boolean(query.value || role.value || createdRange.value),
);
const showActionModal = computed({
  get: () => pendingAction.value !== null,
  set: (show) => {
    if (!show) closeActionModal();
  },
});
const actionConfig = computed(() => {
  const configs: Record<
    UserAction,
    {
      title: string;
      result: string;
      description: string;
      buttonType: 'warning' | 'error' | 'primary';
    }
  > = {
    restrict: {
      title: '限制用户',
      result: '已限制用户',
      description: '限制后，该用户的账号权限将受到限制。',
      buttonType: 'warning',
    },
    unrestrict: {
      title: '取消限制',
      result: '已取消限制',
      description: '取消后，该用户将恢复为普通用户。',
      buttonType: 'primary',
    },
    ban: {
      title: '封禁用户',
      result: '已封禁用户',
      description: '封禁后，该用户将无法登录。',
      buttonType: 'error',
    },
    unban: {
      title: '取消封禁',
      result: '已取消封禁',
      description: '取消后，该用户将恢复为普通用户并可以登录。',
      buttonType: 'primary',
    },
  };
  return pendingAction.value ? configs[pendingAction.value.action] : null;
});

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

async function loadUsers() {
  const currentRequestId = ++requestId;
  loading.value = true;
  errorMessage.value = '';

  try {
    const data = await getUsers(session, {
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
  query.value = queryInput.value.trim();
  role.value = roleInput.value ?? '';
  createdRange.value = createdRangeInput.value
    ? [...createdRangeInput.value]
    : null;
  page.value = 1;
  void loadUsers();
}

function resetFilters() {
  queryInput.value = '';
  roleInput.value = null;
  createdRangeInput.value = null;
  query.value = '';
  role.value = '';
  createdRange.value = null;
  page.value = 1;
  void loadUsers();
}

function changePage(nextPage: number) {
  page.value = nextPage;
  void loadUsers();
}

function changePageSize(nextPageSize: number) {
  pageSize.value = nextPageSize;
  page.value = 1;
  void loadUsers();
}

function requestAction(action: UserAction, user: User) {
  pendingAction.value = { action, user };
  actionReason.value = '';
  actionError.value = '';
  actionSucceeded.value = '';
}

function closeActionModal() {
  if (actionInProgress.value) return;
  pendingAction.value = null;
}

async function confirmAction() {
  const target = pendingAction.value;
  const config = actionConfig.value;
  const reason = actionReason.value.trim();
  if (!target || !config || !reason) return;

  actionInProgress.value = true;
  actionError.value = '';
  try {
    await updateUserRole(session, target.action, {
      username: target.user.name,
      reason,
    });
    pendingAction.value = null;
    actionSucceeded.value = `${config.result} ${target.user.name}`;
    await loadUsers();
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  } finally {
    actionInProgress.value = false;
  }
}

onMounted(loadUsers);
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

    <n-modal
      v-model:show="showActionModal"
      preset="card"
      :title="actionConfig?.title"
      style="width: min(520px, calc(100vw - 32px))"
      :mask-closable="!actionInProgress"
      :close-on-esc="!actionInProgress"
    >
      <n-space vertical :size="16">
        <n-text>
          确认{{ actionConfig?.title }}
          <n-text strong>{{ pendingAction?.user.name }}</n-text>
          ？{{ actionConfig?.description }}
        </n-text>
        <n-input
          v-model:value="actionReason"
          type="textarea"
          :placeholder="`请输入${actionConfig?.title ?? '操作'}原因`"
          :autosize="{ minRows: 3, maxRows: 6 }"
          :disabled="actionInProgress"
          maxlength="500"
          show-count
          @keydown.ctrl.enter="confirmAction"
        />
        <n-alert
          v-if="actionError"
          type="error"
          :title="`${actionConfig?.title ?? '操作'}失败`"
        >
          {{ actionError }}
        </n-alert>
        <div class="modal-actions">
          <n-button :disabled="actionInProgress" @click="closeActionModal">
            取消
          </n-button>
          <n-button
            :type="actionConfig?.buttonType"
            :loading="actionInProgress"
            :disabled="!actionReason.trim()"
            @click="confirmAction"
          >
            确认{{ actionConfig?.title }}
          </n-button>
        </div>
      </n-space>
    </n-modal>
  </n-space>
</template>

<style scoped>
.users-page {
  max-width: 1000px;
  margin-inline: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
