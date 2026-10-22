<script setup lang="ts">
import {
  LockOutlined,
  PersonOutlineOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@vicons/material';
import { computed, ref, watch } from 'vue';

import { useWebKit, useWebKitInternals } from '../../context';
import XButton from '../../ui/button/XButton.vue';
import XDialog from '../../ui/dialog/XDialog.vue';
import XInput from '../../ui/input/XInput.vue';
import { getApiErrorMessage } from '../../ui/toast/apiError';

const open = defineModel<boolean>('open', { required: true });
const { theme } = useWebKit();
const { session, options } = useWebKitInternals();
const username = ref('');
const password = ref('');
const passwordVisible = ref(false);
const error = ref<string>();
const submitting = ref(false);
const returnTo = ref('');
const registerUrl = computed(() => createAccountFlowUrl('register'));
const resetPasswordUrl = computed(() => createAccountFlowUrl('reset-password'));

function createAccountFlowUrl(flow: 'register' | 'reset-password') {
  const url = new URL(options.auth.url);
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/${flow}`;
  url.searchParams.set('app', options.auth.app);
  url.searchParams.set('theme', theme.theme.value);
  url.searchParams.set('returnTo', returnTo.value);
  return url.toString();
}
watch(
  open,
  (isOpen) => {
    error.value = undefined;
    password.value = '';
    passwordVisible.value = false;
    // 宿主可能已切换路由；每次打开都从当前地址构造返回目标。
    if (isOpen && typeof window !== 'undefined') {
      returnTo.value = window.location.href;
    }
  },
  { immediate: true },
);

async function login() {
  if (submitting.value) return;
  error.value = undefined;
  submitting.value = true;
  try {
    await session.login(username.value, password.value);
    open.value = false;
  } catch (reason) {
    error.value = getApiErrorMessage(reason, '登录失败');
  } finally {
    password.value = '';
    passwordVisible.value = false;
    submitting.value = false;
  }
}
</script>

<template>
  <XDialog
    v-model:open="open"
    title="登录"
    close-label="关闭登录窗口"
    :closable="!submitting"
    class="w-[min(420px,calc(100%-2rem))]"
  >
    <form class="login-form flex flex-col gap-4" @submit.prevent="login">
      <XInput
        v-model="username"
        name="username"
        :leading-icon="PersonOutlineOutlined"
        aria-label="用户名或邮箱"
        autocomplete="username"
        placeholder="用户名 / 邮箱"
        required
        :disabled="submitting"
      />
      <XInput
        v-model="password"
        name="password"
        :type="passwordVisible ? 'text' : 'password'"
        :leading-icon="LockOutlined"
        aria-label="密码"
        autocomplete="current-password"
        placeholder="密码"
        required
        :disabled="submitting"
      >
        <template #tail>
          <button
            type="button"
            :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
            :aria-pressed="passwordVisible"
            :disabled="submitting"
            class="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed"
            @mousedown.prevent
            @click="passwordVisible = !passwordVisible"
          >
            <component
              :is="passwordVisible ? VisibilityOutlined : VisibilityOffOutlined"
              class="size-5"
              aria-hidden="true"
            />
          </button>
        </template>
      </XInput>
      <p v-if="error" class="text-sm text-error-text" role="alert">
        {{ error }}
      </p>
      <XButton type="submit" :disabled="submitting" :aria-busy="submitting">
        {{ submitting ? '登录中…' : '登录' }}
      </XButton>
      <div class="flex justify-between gap-4 text-sm text-primary">
        <a
          :href="registerUrl"
          :aria-disabled="submitting"
          @click="submitting && $event.preventDefault()"
        >
          注册账号
        </a>
        <a
          :href="resetPasswordUrl"
          :aria-disabled="submitting"
          @click="submitting && $event.preventDefault()"
        >
          忘记密码？
        </a>
      </div>
    </form>
  </XDialog>
</template>

<style scoped>
/* 仅处理登录表单的自动填充背景，不影响共享 Input。 */
.login-form :deep(input:autofill) {
  background-clip: text;
  -webkit-background-clip: text;
}
</style>
