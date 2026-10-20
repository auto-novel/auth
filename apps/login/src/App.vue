<script setup lang="ts">
import 'vue-sonner/style.css';
import { Toaster } from 'vue-sonner';

const { app, flow, returnTo, theme } = parseUrl();
const succeeded = ref(false);
const dark =
  theme === 'dark' ||
  (theme !== 'light' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.classList.toggle('dark', dark);

function onSuccess() {
  if (returnTo) {
    window.location.replace(returnTo.href);
    return;
  }
  succeeded.value = true;
}

function parseUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams;
  // 按末级路径识别流程，同时支持开发代理等部署前缀。
  const requestedFlow = url.pathname.replace(/\/+$/, '').split('/').pop();
  const flow =
    requestedFlow === 'reset-password' ? 'reset_password' : 'register';
  if (requestedFlow !== 'register' && requestedFlow !== 'reset-password') {
    url.pathname = '/register';
    window.location.replace(url.href);
  }
  return {
    app: query.get('app') || 'auth',
    flow,
    returnTo: validateReturnTo(query.get('returnTo'), url.origin),
    theme: query.get('theme'),
  };
}

function validateReturnTo(
  raw: string | null,
  currentOrigin: string,
): URL | null {
  if (!raw) return null;

  try {
    const target = new URL(raw);
    if (target.username || target.password) return null;

    if (target.origin === currentOrigin) {
      return target.protocol === 'https:' || target.protocol === 'http:'
        ? target
        : null;
    }

    const trusted =
      target.hostname === 'novelia.cc' ||
      target.hostname.endsWith('.novelia.cc');
    return target.protocol === 'https:' && trusted ? target : null;
  } catch {
    return null;
  }
}
</script>

<template>
  <Toaster position="top-center" />
  <!-- Keep an explicit scrollport so every field remains reachable with a keyboard. -->
  <div
    class="bg-surface text-on-surface flex h-dvh w-full flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain px-8 pt-[10vh] pb-8"
  >
    <div class="mx-auto flex w-full max-w-md shrink-0 flex-col gap-4">
      <img
        class="m-auto mt-0 mb-0 aspect-square w-1/2 max-w-[200px] select-none"
        src="https://n.novelia.cc/files-extra/girl.6e4fe22c238737fd028247f8f0cfd4ee.webp"
        alt=""
      />

      <div
        v-if="succeeded"
        role="status"
        class="flex flex-col gap-2 text-center"
      >
        <h1 class="text-xl font-bold">
          {{ flow === 'register' ? '注册成功' : '密码重置成功' }}
        </h1>
        <p>请返回应用登录。</p>
      </div>
      <template v-else>
        <h1 class="text-center text-xl font-bold">
          {{ flow === 'register' ? '注册' : '重置密码' }}
        </h1>
        <FormRegister
          v-if="flow === 'register'"
          :app="app"
          @success="onSuccess"
        />
        <FormResetPassword v-else @success="onSuccess" />
      </template>
    </div>
  </div>
</template>
