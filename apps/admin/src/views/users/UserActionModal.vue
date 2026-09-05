<script setup lang="ts">
import { NAlert, NButton, NInput, NModal, NSpace, NText } from 'naive-ui';
import { computed, ref, watch } from 'vue';

import { useAdminApi, type User, type UserAction } from '@/api';

interface UserActionTarget {
  action: UserAction;
  user: User;
}

const props = defineProps<{ target: UserActionTarget | null }>();
const emit = defineEmits<{
  close: [];
  success: [message: string];
}>();

const api = useAdminApi();
const reason = ref('');
const inProgress = ref(false);
const errorMessage = ref('');
const banReasonOptions = ['广告', '倒狗'];

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
    trust: {
      title: '信任用户',
      result: '已信任用户',
      description: '设置后，该用户将获得可信用户权限。',
      buttonType: 'primary',
    },
    untrust: {
      title: '取消信任',
      result: '已取消用户的可信状态',
      description: '取消后，该用户将恢复为普通用户。',
      buttonType: 'primary',
    },
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
  return props.target ? configs[props.target.action] : null;
});

const requiresReason = computed(
  () => props.target?.action !== 'trust' && props.target?.action !== 'untrust',
);

watch(
  () => props.target,
  () => {
    reason.value = '';
    errorMessage.value = '';
  },
);

function close() {
  if (!inProgress.value) emit('close');
}

function updateUserRole(
  action: UserAction,
  username: string,
  actionReason: string,
) {
  switch (action) {
    case 'trust':
      return api.admin.trustUser({ username });
    case 'untrust':
      return api.admin.untrustUser({ username });
    case 'restrict':
      return api.admin.restrictUser({ username, reason: actionReason });
    case 'unrestrict':
      return api.admin.unrestrictUser({ username, reason: actionReason });
    case 'ban':
      return api.admin.banUser({ username, reason: actionReason });
    case 'unban':
      return api.admin.unbanUser({ username, reason: actionReason });
    default: {
      const unsupportedAction: never = action;
      throw new Error(`不支持的用户操作：${unsupportedAction}`);
    }
  }
}

async function confirm() {
  const target = props.target;
  const config = actionConfig.value;
  const actionReason = reason.value.trim();
  if (!target || !config || (requiresReason.value && !actionReason)) return;

  inProgress.value = true;
  errorMessage.value = '';
  try {
    await updateUserRole(target.action, target.user.username, actionReason);
    emit('success', `${config.result} ${target.user.username}`);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    inProgress.value = false;
  }
}
</script>

<template>
  <n-modal
    :show="target !== null"
    preset="card"
    :title="actionConfig?.title"
    style="width: min(520px, calc(100vw - 32px))"
    :mask-closable="!inProgress"
    :close-on-esc="!inProgress"
    @update:show="(show) => !show && close()"
  >
    <n-space vertical :size="16">
      <div class="action-message">
        <n-text>
          确认{{ actionConfig?.title }}
          <n-text strong>{{ target?.user.username }}</n-text>
          ？{{ actionConfig?.description }}
        </n-text>
        <n-text
          v-if="target?.action === 'restrict' || target?.action === 'ban'"
          strong
          :type="target.action === 'ban' ? 'error' : 'warning'"
        >
          ！不推荐直接限制/封禁用户，优先使用“三振出局”。
        </n-text>
      </div>
      <n-space v-if="target?.action === 'ban'" align="center" size="small">
        <n-text depth="3">快速填写：</n-text>
        <n-button
          v-for="option in banReasonOptions"
          :key="option"
          size="small"
          secondary
          :type="reason === option ? 'primary' : 'default'"
          :disabled="inProgress"
          @click="reason = option"
        >
          {{ option }}
        </n-button>
      </n-space>
      <n-input
        v-if="requiresReason"
        v-model:value="reason"
        type="textarea"
        :placeholder="`请输入${actionConfig?.title ?? '操作'}原因`"
        :autosize="{ minRows: 3, maxRows: 6 }"
        :disabled="inProgress"
        maxlength="500"
        show-count
        @keydown.ctrl.enter="confirm"
      />
      <n-alert
        v-if="errorMessage"
        type="error"
        :title="`${actionConfig?.title ?? '操作'}失败`"
      >
        {{ errorMessage }}
      </n-alert>
      <div class="modal-actions">
        <n-button :disabled="inProgress" @click="close">取消</n-button>
        <n-button
          :type="actionConfig?.buttonType"
          :loading="inProgress"
          :disabled="requiresReason && !reason.trim()"
          @click="confirm"
        >
          确认{{ actionConfig?.title }}
        </n-button>
      </div>
    </n-space>
  </n-modal>
</template>

<style scoped>
.action-message {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
