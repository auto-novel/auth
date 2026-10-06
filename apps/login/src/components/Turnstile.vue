<script setup lang="ts">
import { loadTurnstileScript } from '../data/turnstile';

const SITE_KEY = '0x4AAAAAAFOswITt_UDDpCC3';

/**
 * Cloudflare Turnstile widget.
 *
 * The widget is rendered explicitly into a local container so a single page can
 * host several instances. The token it produces is single-use and expires, so
 * the parent must send it promptly and reset the widget after every request.
 */
interface Props {
  /** Turnstile action for this surface; validated server-side via siteverify. */
  action: string;
}

const props = defineProps<Props>();

interface Emits {
  /** Fired with the current token, or an empty string when it is unusable. */
  'update:token': [token: string];
}

const emits = defineEmits<Emits>();

let widgetId: string | undefined;

const container = ref<HTMLDivElement | null>(null);
const failed = ref(false);
const loading = ref(true);

function onToken(token: string) {
  failed.value = false;
  emits('update:token', token);
}

function onError() {
  failed.value = true;
  emits('update:token', '');
}

function renderWidget() {
  if (!container.value || !window.turnstile) return;
  widgetId = window.turnstile.render(container.value, {
    sitekey: SITE_KEY,
    action: props.action,
    language: 'zh-CN',
    callback: onToken,
    'error-callback': onError,
    'expired-callback': () => {
      // The previous token is no longer accepted; wait for the next callback.
      emits('update:token', '');
    },
  });
}

onMounted(async () => {
  try {
    await loadTurnstileScript();
    renderWidget();
  } catch {
    onError();
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  if (widgetId !== undefined && window.turnstile) {
    window.turnstile.remove(widgetId);
    widgetId = undefined;
  }
});

/** Discards the current token and starts a fresh challenge. */
function reset() {
  emits('update:token', '');
  failed.value = false;
  if (widgetId !== undefined && window.turnstile) {
    window.turnstile.reset(widgetId);
  }
}

defineExpose({ reset });
</script>

<template>
  <div class="relative min-h-[65px] w-full max-w-[300px]" :aria-busy="loading">
    <div ref="container"></div>
    <p
      v-if="loading"
      role="status"
      class="absolute inset-0 flex items-center justify-center text-xs text-[#8d8d8d]"
    >
      人机验证加载中…
    </p>
  </div>
  <p v-if="failed" class="mt-2 text-left text-xs text-[#8d8d8d] select-none">
    * 人机验证加载失败，请刷新页面后重试
  </p>
</template>
