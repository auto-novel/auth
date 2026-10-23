<script setup lang="ts">
import { Toast, XButton, XDialog, XTextarea } from '@novelia/web-kit';
import { computed, ref, watch } from 'vue';

import { useAdminApi, type User, type UserAction } from '@/api';

interface UserActionTarget {
  action: UserAction;
  user: User;
}

const props = defineProps<{ target: UserActionTarget | null }>();
const emit = defineEmits<{
  close: [];
  success: [];
}>();

const api = useAdminApi();
const reason = ref('');
const inProgress = ref(false);
const banReasonOptions = ['广告', '倒狗'];

const actionConfig = computed(() => {
  const configs: Record<
    UserAction,
    {
      title: string;
      result: string;
      description: string;
      buttonColor: 'warning' | 'danger' | 'primary';
    }
  > = {
    trust: {
      title: '信任用户',
      result: '已信任用户',
      description: '设置后，该用户将获得可信用户权限。',
      buttonColor: 'primary',
    },
    untrust: {
      title: '取消信任',
      result: '已取消用户的可信状态',
      description: '取消后，该用户将恢复为普通用户。',
      buttonColor: 'primary',
    },
    restrict: {
      title: '限制用户',
      result: '已限制用户',
      description: '限制后，该用户的账号权限将受到限制。',
      buttonColor: 'warning',
    },
    unrestrict: {
      title: '取消限制',
      result: '已取消限制',
      description: '取消后，该用户将恢复为普通用户。',
      buttonColor: 'primary',
    },
    ban: {
      title: '封禁用户',
      result: '已封禁用户',
      description: '封禁后，该用户将无法登录。',
      buttonColor: 'danger',
    },
    unban: {
      title: '取消封禁',
      result: '已取消封禁',
      description: '取消后，该用户将恢复为普通用户并可以登录。',
      buttonColor: 'primary',
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
  if (
    inProgress.value ||
    !target ||
    !config ||
    (requiresReason.value && !actionReason)
  )
    return;

  inProgress.value = true;
  await Toast.promise(
    updateUserRole(target.action, target.user.username, actionReason).then(
      () => {
        emit('success');
      },
    ),
    {
      loading: `正在${config.title}`,
      success: `${config.result} ${target.user.username}`,
      error: `${config.title}失败`,
    },
  ).finally(() => {
    inProgress.value = false;
  });
}
</script>

<template>
  <XDialog
    :open="target !== null"
    :title="actionConfig?.title"
    class="w-[520px]"
    :closable="!inProgress"
    @update:open="(open) => !open && close()"
  >
    <div class="flex flex-col gap-4">
      <div class="action-message">
        <p class="m-0 text-ink">
          确认{{ actionConfig?.title }}
          <strong class="text-ink">{{ target?.user.username }}</strong>
          ？{{ actionConfig?.description }}
        </p>
        <strong
          v-if="target?.action === 'restrict' || target?.action === 'ban'"
          :class="target.action === 'ban' ? 'text-error' : 'text-warning'"
        >
          ！不推荐直接限制/封禁用户，优先使用“三振出局”。
        </strong>
      </div>
      <div
        v-if="target?.action === 'ban'"
        class="flex flex-wrap items-center gap-2"
      >
        <span class="text-muted">快速填写：</span>
        <XButton
          v-for="option in banReasonOptions"
          :key="option"
          size="sm"
          :color="reason === option ? 'primary' : 'neutral'"
          variant="soft"
          class="h-7 min-h-0 rounded-[3px] px-2.5 font-normal"
          :disabled="inProgress"
          @click="reason = option"
        >
          {{ option }}
        </XButton>
      </div>
      <XTextarea
        v-if="requiresReason"
        v-model="reason"
        :placeholder="`请输入${actionConfig?.title ?? '操作'}原因`"
        :autosize="{ minRows: 3, maxRows: 6 }"
        :disabled="inProgress"
        maxlength="500"
        show-count
        @keydown.ctrl.enter="confirm"
      />
      <div class="modal-actions">
        <XButton
          color="neutral"
          variant="outline"
          :disabled="inProgress"
          @click="close"
        >
          取消
        </XButton>
        <XButton
          :color="actionConfig?.buttonColor ?? 'neutral'"
          :loading="inProgress"
          :disabled="requiresReason && !reason.trim()"
          @click="confirm"
        >
          确认{{ actionConfig?.title }}
        </XButton>
      </div>
    </div>
  </XDialog>
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
