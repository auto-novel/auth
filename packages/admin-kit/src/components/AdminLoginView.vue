<script setup lang="ts">
import { NAlert } from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAdminKit, useAdminTheme } from '../context';
import { ADMIN_HOME_ROUTE } from '../router';

const { options, api } = useAdminKit();
const { isDark } = useAdminTheme();
const route = useRoute();
const router = useRouter();
const iframe = ref<HTMLIFrameElement>();
const completingLogin = ref(false);
const loginError = ref<string>();
const authUrl = options.auth.url;
const authOrigin = new URL(authUrl).origin;
let disposed = false;

function isLoginSuccessMessage(data: unknown) {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    data.type === 'login_success'
  );
}

const iframeSrc = computed(() => {
  const url = new URL(authUrl);
  url.searchParams.set('app', options.auth.app);
  url.searchParams.set('theme', isDark.value ? 'dark' : 'light');
  return url.toString();
});

async function handleMessage(event: MessageEvent) {
  if (
    event.origin !== authOrigin ||
    event.source !== iframe.value?.contentWindow ||
    !isLoginSuccessMessage(event.data) ||
    completingLogin.value
  ) {
    return;
  }

  completingLogin.value = true;
  loginError.value = undefined;
  try {
    await api.auth.refresh();
    if (disposed) return;

    const redirect = route.query.redirect;
    await router.replace(
      typeof redirect === 'string' &&
        redirect.startsWith('/') &&
        !redirect.startsWith('//')
        ? redirect
        : ADMIN_HOME_ROUTE,
    );
  } catch {
    if (!disposed) loginError.value = '登录状态同步失败，请重试';
  } finally {
    if (!disposed) completingLogin.value = false;
  }
}

onMounted(() => {
  disposed = false;
  window.addEventListener('message', handleMessage);
});
onBeforeUnmount(() => {
  disposed = true;
  window.removeEventListener('message', handleMessage);
});
</script>

<template>
  <main class="login-page">
    <iframe
      ref="iframe"
      class="login-frame"
      :src="iframeSrc"
      title="登录或注册"
      frameborder="0"
    />
    <n-alert
      v-if="loginError"
      class="login-error"
      type="error"
      closable
      @close="loginError = undefined"
    >
      {{ loginError }}
    </n-alert>
  </main>
</template>

<style scoped>
.login-page {
  position: relative;
  width: 100%;
  height: 100dvh;
}

.login-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.login-error {
  position: absolute;
  top: 16px;
  left: 50%;
  width: min(420px, calc(100vw - 32px));
  transform: translateX(-50%);
  z-index: 3;
}
</style>
