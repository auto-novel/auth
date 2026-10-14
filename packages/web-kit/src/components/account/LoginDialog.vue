<script setup lang="ts">
import { CloseOutlined } from '@vicons/material';
import {
  computed,
  type CSSProperties,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';

import { useWebKit, useWebKitInternals } from '../../context';

const open = defineModel<boolean>('open', { required: true });
const { theme } = useWebKit();
const { accountActions } = useWebKitInternals();
const loginFrame = useTemplateRef('loginFrame');
const viewportStyle = ref<CSSProperties>({});
const error = ref<string>();
const completing = ref(false);
const frameSrc = computed(() =>
  accountActions.createLoginUrl(theme.theme.value),
);

watch(
  open,
  (value, _, onCleanup) => {
    error.value = undefined;
    viewportStyle.value = {};
    if (!value || typeof window === 'undefined') return;

    // 同步宿主可见视口，避免移动端键盘遮挡 iframe。
    const viewport = window.visualViewport;
    if (!viewport) return;

    const syncViewport = () => {
      viewportStyle.value = {
        top: `${viewport.offsetTop}px`,
        height: `${viewport.height}px`,
        bottom: 'auto',
      };
    };

    syncViewport();
    viewport.addEventListener('resize', syncViewport);
    viewport.addEventListener('scroll', syncViewport);
    onCleanup(() => {
      viewport.removeEventListener('resize', syncViewport);
      viewport.removeEventListener('scroll', syncViewport);
    });
  },
  { immediate: true },
);

function close() {
  if (completing.value) return;
  open.value = false;
  error.value = undefined;
}

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

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) close();
}

onMounted(() => {
  window.addEventListener('message', handleMessage);
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage);
  window.removeEventListener('keydown', handleKeydown);
});

async function focusLoginFrame() {
  await nextTick();
  loginFrame.value?.focus();
}
</script>

<template>
  <Teleport to="body">
    <!-- 全屏嵌入，保持登录页与独立访问时的布局一致。 -->
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-surface"
      :style="viewportStyle"
      role="dialog"
      aria-modal="true"
      aria-label="登录或注册"
      @vue:mounted="focusLoginFrame"
    >
      <button
        type="button"
        class="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-black/55 text-white transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="关闭登录窗口"
        @click="close"
      >
        <CloseOutlined class="size-5" aria-hidden="true" />
      </button>

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
    </div>
  </Teleport>
</template>
