<script setup lang="ts">
import 'vue-sonner/style.css';
import { Toaster } from 'vue-sonner';
import { loadTurnstileScript } from './data/turnstile';

// Start loading before the user opens a form; the widget retries on failure.
void loadTurnstileScript().catch(() => {});

const type = ref('登录');

const query = new URLSearchParams(window.location.search);
const app = query.get('app') || 'auth';
const theme = parseTheme();

function parseTheme() {
  const theme = query.get('theme');
  if (theme === 'dark' || theme === 'light') {
    return theme;
  } else {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}

const root = window.document.documentElement;
root.classList.toggle('dark', theme === 'dark');
</script>

<template>
  <Toaster position="top-center" />
  <!--
    One layout at every width: a full-page surface with a centered content
    column. The page is shown either on its own or inside a full-page iframe
    (web-kit / admin-kit), so the old viewport-based card on wide screens only
    made the embedded and standalone renderings diverge.
  -->
  <div class="bg-surface flex min-h-dvh w-full flex-col px-8 pt-[10vh] pb-8">
    <div class="mx-auto flex w-full max-w-md flex-col gap-4">
      <img
        class="m-auto mt-0 mb-0 aspect-square w-1/2 max-w-[200px] select-none"
        src="https://n.novelia.cc/files-extra/girl.6e4fe22c238737fd028247f8f0cfd4ee.webp"
        alt=""
      />

      <Tabs :tabs="['登录', '注册']" v-model="type" />

      <!--
        The forms stay mounted and are toggled with `v-show`, so switching tabs
        does not tear down their Turnstile widget and force a new challenge.
      -->
      <FormLogin
        v-show="type === '登录'"
        :app="app"
        @openResetPasswordForm="type = '重置密码'"
      />

      <FormRegister v-show="type === '注册'" :app="app" />

      <FormResetPassword
        v-show="type === '重置密码'"
        @openLoginForm="type = '登录'"
      />
    </div>
  </div>
</template>
