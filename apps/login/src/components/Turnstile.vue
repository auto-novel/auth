<script lang="ts">
/** Options accepted by `turnstile.render`. */
interface TurnstileRenderOptions {
  sitekey: string;
  language?: string;
  action?: string;
  callback?: (token: string) => void;
  'error-callback'?: (errorCode?: string) => void;
  'expired-callback'?: () => void;
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileRenderOptions): string;
  remove(widgetId: string): void;
  reset(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Shared loader for the Cloudflare Turnstile script.
 *
 * The script is loaded once per page, no matter how many widgets mount. A
 * failed load is retried on the next mount instead of being cached forever.
 */

const SITE_KEY = '0x4AAAAAAFOswITt_UDDpCC3';
const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** In-flight load, shared by every widget on the page. */
let pending: Promise<void> | undefined;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (pending) return pending;

  pending = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    const timeout = setTimeout(onError, 10000);

    function cleanup() {
      clearTimeout(timeout);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      pending = undefined;
    }

    function onLoad() {
      if (!window.turnstile) {
        onError();
        return;
      }
      cleanup();
      resolve();
    }

    function onError() {
      cleanup();
      script.remove();
      reject(new Error('Failed to load the Turnstile script'));
    }

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    document.head.appendChild(script);
  });

  return pending;
}
</script>

<script setup lang="ts">
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
  <div ref="container" class="cf-turnstile w-full max-w-[300px]"></div>
  <p v-if="failed" class="mt-2 text-left text-xs text-[#8d8d8d] select-none">
    * 人机验证加载失败，请刷新页面后重试
  </p>
</template>
