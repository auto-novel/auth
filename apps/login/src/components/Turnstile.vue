<script setup lang="ts">
import { loadTurnstileScript } from '../data/turnstile';

const SITE_KEY = '0x4AAAAAAFOswITt_UDDpCC3';

/**
 * Cloudflare Turnstile widget.
 *
 * The widget is rendered explicitly into a local container so a single page can
 * host several instances. The token it produces is single-use and expires, so
 * the parent must send it promptly and reset the widget after every request.
 *
 * Hosts keep this component mounted while the user switches tabs and steps
 * (`v-show`), so the widget is not thrown away and re-challenged on every
 * navigation. Rendering waits until the container is actually visible: a hidden
 * container has no width, and rendering a `flexible` widget into one produces a
 * broken layout.
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
let observer: ResizeObserver | undefined;
let scriptReady = false;
/** Last token handed to the parent; '' means the widget has none to offer. */
let token = '';
/** Whether the container had a box the last time the observer ran. */
let visible = false;

const container = ref<HTMLDivElement | null>(null);
const failed = ref(false);
const loading = ref(true);

function onToken(value: string) {
  failed.value = false;
  token = value;
  emits('update:token', value);
}

function onError() {
  failed.value = true;
  token = '';
  emits('update:token', '');
}

function renderWidget() {
  if (widgetId !== undefined || !window.turnstile) return;
  const element = container.value;
  if (!element || element.clientWidth === 0) return;

  widgetId = window.turnstile.render(element, {
    sitekey: SITE_KEY,
    size: 'flexible',
    theme: document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light',
    action: props.action,
    language: 'zh-CN',
    callback: onToken,
    'error-callback': onError,
    'expired-callback': () => {
      // The previous token is no longer accepted; wait for the next callback.
      token = '';
      emits('update:token', '');
    },
  });
  loading.value = false;
}

/** Renders the widget once its container is visible, retrying a failed load. */
async function ensureWidget() {
  if (widgetId !== undefined) return;

  if (!scriptReady) {
    try {
      await loadTurnstileScript();
      scriptReady = true;
    } catch {
      onError();
      loading.value = false;
      return;
    }
  }
  renderWidget();
}

/** Reacts to show/hide transitions; the first visible one renders the widget. */
function onContainerResize() {
  const element = container.value;
  if (!element) return;

  if (element.clientWidth === 0) {
    visible = false;
    return;
  }
  if (visible) return;
  visible = true;

  if (widgetId === undefined) {
    void ensureWidget();
  } else if (token === '') {
    // The token was consumed or expired while the widget was hidden.
    reset();
  }
}

onMounted(() => {
  if (!container.value) return;
  observer = new ResizeObserver(onContainerResize);
  observer.observe(container.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = undefined;
  if (widgetId !== undefined && window.turnstile) {
    window.turnstile.remove(widgetId);
    widgetId = undefined;
  }
});

/** Discards the current token and starts a fresh challenge. */
function reset() {
  token = '';
  emits('update:token', '');
  failed.value = false;
  if (widgetId !== undefined && window.turnstile) {
    window.turnstile.reset(widgetId);
  }
}

defineExpose({ reset });
</script>

<template>
  <div class="relative min-h-[65px] w-full" :aria-busy="loading">
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
