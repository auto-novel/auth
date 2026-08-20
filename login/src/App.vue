<script setup lang="ts">
import 'vue-sonner/style.css';
import { Toaster } from 'vue-sonner';

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
  <div
    class="fixed top-0 right-0 bottom-0 left-0 overflow-y-auto bg-[url('https://books.fishhawk.top/assets/banner-BtpB_r33.webp')]"
  >
    <div class="absolute top-0 right-0 bottom-0 left-0 -z-10 bg-black/80"></div>

    <div
      class="bg-surface m-auto flex h-full w-full flex-col gap-4 pt-[10vh] pr-8 pb-8 pl-8 sm:mt-[10vh] sm:h-auto sm:w-md sm:rounded-2xl sm:p-8"
    >
      <img
        class="m-auto mt-0 mb-0 aspect-square w-1/2 max-w-[200px] select-none"
        src="https://n.novelia.cc/files-extra/girl.6e4fe22c238737fd028247f8f0cfd4ee.webp"
        alt=""
      />

      <Tabs :tabs="['登录', '注册']" v-model="type" />

      <FormLogin
        v-if="type === '登录'"
        :app="app"
        @openResetPasswordForm="type = '重置密码'"
      />

      <FormRegister v-else-if="type === '注册'" :app="app" />

      <FormResetPassword
        v-else-if="type === '重置密码'"
        @openLoginForm="type = '登录'"
      />
    </div>
  </div>
</template>
