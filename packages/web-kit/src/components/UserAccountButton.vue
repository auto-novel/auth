<script setup lang="ts">
import {
  CloseOutlined,
  ExitToAppOutlined,
  KeyboardArrowDownOutlined,
} from '@vicons/material';
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue';
import { RouterLink } from 'vue-router';

import { useWebKit } from '../context';
import type { WebKitMenuOption } from '../types';

defineProps<{ options: WebKitMenuOption[] }>();

const roleLabels: Record<string, string> = {
  admin: '管理员',
  trusted: '受信任用户',
  member: '成员',
  restricted: '受限用户',
  banned: '已封禁用户',
};

const { api: authApi, profile: authUser } = useWebKit();
const accountRoot = useTemplateRef('accountRoot');
const loginFrame = useTemplateRef('loginFrame');
const menuOpen = ref(false);
const loginOpen = ref(false);
const loginError = ref<string>();
const completingLogin = ref(false);

const roleLabel = computed(() => {
  const role = authUser.value?.role;
  return role ? (roleLabels[role] ?? role) : '未知角色';
});

const createdAt = computed(() => {
  const timestamp = authUser.value?.createdAt;
  if (!timestamp) return '未知日期';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(
    timestamp * 1000,
  );
});

const loginFrameSrc = authApi.createLoginUrl('light');

function handleDocumentClick(event: MouseEvent) {
  if (accountRoot.value?.contains(event.target as Node)) return;
  menuOpen.value = false;
  document.removeEventListener('click', handleDocumentClick);
}

function openMenu() {
  menuOpen.value = !menuOpen.value;
  if (menuOpen.value) document.addEventListener('click', handleDocumentClick);
  else document.removeEventListener('click', handleDocumentClick);
}

function openLogin() {
  loginError.value = undefined;
  loginOpen.value = true;
}

function closeLogin() {
  if (completingLogin.value) return;
  loginOpen.value = false;
  loginError.value = undefined;
}

async function handleMessage(event: MessageEvent) {
  if (!loginOpen.value || completingLogin.value) return;
  const completion = authApi.handleLoginMessage(
    event,
    loginFrame.value?.contentWindow,
  );
  if (!completion) return;

  completingLogin.value = true;
  loginError.value = undefined;
  try {
    await completion;
    loginOpen.value = false;
  } catch {
    loginError.value = '登录状态同步失败，请重试';
  } finally {
    completingLogin.value = false;
  }
}

async function logout() {
  menuOpen.value = false;
  try {
    await authApi.logout();
  } catch {
    // auth-api clears the local session even if the remote session has expired.
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  if (loginOpen.value) closeLogin();
  else menuOpen.value = false;
}

window.addEventListener('message', handleMessage);
window.addEventListener('keydown', handleKeydown);

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('message', handleMessage);
  window.removeEventListener('keydown', handleKeydown);
});

async function focusLoginFrame() {
  await nextTick();
  loginFrame.value?.focus();
}
</script>

<template>
  <div ref="accountRoot" class="relative ml-auto min-w-0 flex-none">
    <button
      v-if="authUser"
      type="button"
      class="account-trigger"
      :aria-expanded="menuOpen"
      aria-haspopup="menu"
      @click="openMenu"
    >
      <span class="max-w-20 truncate sm:max-w-none">
        @{{ authUser.username }}
      </span>
      <KeyboardArrowDownOutlined class="size-4 flex-none" aria-hidden="true" />
    </button>

    <button v-else type="button" class="account-trigger" @click="openLogin">
      登录/注册
    </button>

    <div v-if="menuOpen && authUser" class="account-menu" role="menu">
      <div class="px-3 py-2.5">
        <p class="text-sm font-medium text-ink">{{ roleLabel }}</p>
        <p class="mt-0.5 text-xs text-muted">注册于 {{ createdAt }}</p>
      </div>
      <div class="border-t border-divider p-1">
        <RouterLink
          v-for="option in options"
          :key="option.key"
          :to="option.to"
          class="account-menu-item"
          role="menuitem"
          @click="menuOpen = false"
        >
          <component :is="option.icon" class="size-4" aria-hidden="true" />
          {{ option.label }}
        </RouterLink>
        <button
          type="button"
          class="account-menu-item"
          role="menuitem"
          @click="logout"
        >
          <ExitToAppOutlined class="size-4" aria-hidden="true" />
          退出账号
        </button>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="loginOpen"
      class="fixed inset-0 z-50 grid bg-black/45 p-4 sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label="登录或注册"
      @vue:mounted="focusLoginFrame"
      @click.self="closeLogin"
    >
      <div
        class="relative h-full w-full overflow-hidden bg-surface shadow-2xl sm:h-[min(760px,calc(100dvh-3rem))] sm:max-w-lg sm:rounded-xl"
      >
        <button
          type="button"
          class="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-black/55 text-white transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="关闭登录窗口"
          @click="closeLogin"
        >
          <CloseOutlined class="size-5" aria-hidden="true" />
        </button>

        <iframe
          ref="loginFrame"
          class="h-full w-full border-0"
          :src="loginFrameSrc"
          title="登录或注册"
        />

        <p
          v-if="loginError"
          class="absolute right-4 bottom-4 left-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow"
          role="alert"
        >
          {{ loginError }}
        </p>
      </div>
    </div>
  </Teleport>
</template>
