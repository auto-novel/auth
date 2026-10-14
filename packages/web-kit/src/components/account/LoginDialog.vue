<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';

import { useWebKit, useWebKitInternals } from '../../context';
import XDialog from '../../ui/dialog/XDialog.vue';

const open = defineModel<boolean>('open', { required: true });
const { theme } = useWebKit();
const { accountActions } = useWebKitInternals();
const loginFrame = useTemplateRef('loginFrame');
const error = ref<string>();
const completing = ref(false);
const frameSrc = computed(() =>
  accountActions.createLoginUrl(theme.theme.value),
);

watch(open, () => {
  error.value = undefined;
});

async function handleMessage(event: MessageEvent) {
  if (!open.value || completing.value) return;
  const completion = accountActions.handleLoginMessage(
    event,
    loginFrame.value?.contentWindow,
  );
  if (!completion) return;

  completing.value = true;
  error.value = undefined;
  try {
    await completion;
    open.value = false;
  } catch {
    error.value = '登录状态同步失败，请重试';
  } finally {
    completing.value = false;
  }
}

onMounted(() => {
  window.addEventListener('message', handleMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage);
});

async function focusLoginFrame(event: Event) {
  event.preventDefault();
  await nextTick();
  loginFrame.value?.focus();
}
</script>

<template>
  <XDialog
    v-model:open="open"
    title="登录或注册"
    close-label="关闭登录窗口"
    full-screen
    :closable="!completing"
    @open-auto-focus="focusLoginFrame"
  >
    <iframe
      ref="loginFrame"
      class="block h-full w-full border-0"
      :src="frameSrc"
      title="登录或注册"
    />

    <p
      v-if="error"
      class="absolute bottom-4 left-1/2 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-md border border-error-border bg-surface px-4 py-3 text-sm text-error-strong shadow"
      style="
        background-image: linear-gradient(
          var(--color-error-soft),
          var(--color-error-soft)
        );
      "
      role="alert"
    >
      {{ error }}
    </p>
  </XDialog>
</template>
