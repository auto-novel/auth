<script setup lang="ts">
import {
  CloseOutlined,
  ExitToAppOutlined,
  GavelOutlined,
  KeyboardArrowDownOutlined,
} from '@vicons/material';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui';
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
import { RouterLink, type RouteLocationRaw } from 'vue-router';

import { useWebKit, useWebKitInternals } from '../context';
import type { WebKitMenuOption } from '../types';
import XTime from '../ui/XTime.vue';
import AccountMenuOptions from './AccountMenuOptions.vue';

defineProps<{ options: WebKitMenuOption[] }>();

const { logout: signOut, whoami, theme: webTheme } = useWebKit();
const { attention, options: kitOptions, accountActions } = useWebKitInternals();
const loginFrame = useTemplateRef('loginFrame');
const menuOpen = ref(false);
const loginOpen = ref(false);
const loginViewportStyle = ref<CSSProperties>({});

watch(loginOpen, (open, _, onCleanup) => {
  loginViewportStyle.value = {};
  if (!open) return;

  // iframe 无法感知宿主被键盘缩小的可见视口，由父页面同步其位置和高度。
  const viewport = window.visualViewport;
  if (!viewport) return;

  const syncViewport = () => {
    loginViewportStyle.value = {
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
});
const loginError = ref<string>();
const completingLogin = ref(false);
const strikesEnabled = computed(() => kitOptions.strikes.enabled);
const strikesTo = computed(() => kitOptions.strikes.to as RouteLocationRaw);
const hasUnreadStrikes = computed(
  () =>
    strikesEnabled.value && attention.status.value?.strikes.hasUnread === true,
);

const accountLabel = computed(() => {
  const user = whoami.value.user;
  if (!user) return '登录/注册';
  const attention = hasUnreadStrikes.value ? '，有新的处罚记录' : '';
  return `账号 @${user.username}${attention}`;
});

const loginFrameSrc = computed(() =>
  accountActions.createLoginUrl(webTheme.theme.value),
);

watch(menuOpen, (open) => {
  if (open) void attention.refresh();
});

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
  const completion = accountActions.handleLoginMessage(
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
    await signOut();
  } catch {
    // The auth session clears the local session even if the remote session has expired.
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && loginOpen.value) closeLogin();
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
  <div class="relative ml-auto min-w-0 flex-none">
    <DropdownMenuRoot v-if="whoami.isSignedIn" v-model:open="menuOpen">
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="account-trigger"
          :aria-label="accountLabel"
        >
          <span class="max-w-24 truncate sm:max-w-48">
            @{{ whoami.user?.username }}
          </span>
          <span
            class="grid size-2 flex-none place-items-center"
            aria-hidden="true"
          >
            <Transition
              enter-active-class="transition-opacity duration-150"
              enter-from-class="opacity-0"
              leave-active-class="transition-opacity duration-150"
              leave-to-class="opacity-0"
            >
              <span
                v-if="hasUnreadStrikes"
                class="size-1.5 rounded-full bg-error ring-2 ring-surface"
              />
            </Transition>
          </span>
          <KeyboardArrowDownOutlined
            class="size-4 flex-none"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          align="end"
          :side-offset="8"
          :collision-padding="8"
          class="account-menu z-40 outline-none"
        >
          <DropdownMenuLabel class="p-0">
            <button
              v-if="whoami.isAdmin"
              type="button"
              class="block w-full cursor-pointer px-3 py-2.5 text-left transition-colors hover:bg-hover"
              :aria-pressed="whoami.asAdmin"
              @click="accountActions.toggleAdminMode()"
            >
              <span class="block text-sm font-medium text-ink">
                {{ whoami.roleLabel }}{{ whoami.asAdmin ? '+' : '' }}
              </span>
              <span class="mt-0.5 block text-xs text-muted">
                注册于
                <XTime :time="whoami.user?.createdAt" preset="date" />
              </span>
            </button>
            <div v-else class="px-3 py-2.5">
              <p class="text-sm font-medium text-ink">
                {{ whoami.roleLabel }}
              </p>
              <p class="mt-0.5 text-xs text-muted">
                注册于
                <XTime :time="whoami.user?.createdAt" preset="date" />
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator class="border-t border-divider" />
          <div class="p-1">
            <AccountMenuOptions :options="options" />
            <DropdownMenuItem v-if="strikesEnabled" as-child>
              <RouterLink :to="strikesTo" class="menu-item">
                <GavelOutlined class="size-4" aria-hidden="true" />
                <span class="min-w-0 flex-1">处罚记录</span>
                <span
                  v-if="hasUnreadStrikes"
                  class="rounded-full bg-error-soft px-1.5 py-0.5 text-[10px] leading-none font-medium text-error-strong"
                  aria-hidden="true"
                >
                  新
                </span>
                <span v-if="hasUnreadStrikes" class="sr-only">
                  ，有新的处罚记录
                </span>
              </RouterLink>
            </DropdownMenuItem>
            <DropdownMenuItem class="menu-item" @select="logout">
              <ExitToAppOutlined class="size-4" aria-hidden="true" />
              退出账号
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>

    <button v-else type="button" class="account-trigger" @click="openLogin">
      登录/注册
    </button>
  </div>

  <Teleport to="body">
    <!--
      The login page is embedded full-page, matching how the auth app renders
      it standalone. A constrained modal iframe would
      make the page's own viewport-based layout diverge from that rendering.
    -->
    <div
      v-if="loginOpen"
      class="fixed inset-0 z-50 bg-surface"
      :style="loginViewportStyle"
      role="dialog"
      aria-modal="true"
      aria-label="登录或注册"
      @vue:mounted="focusLoginFrame"
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
        class="block h-full w-full border-0"
        :src="loginFrameSrc"
        title="登录或注册"
      />

      <p
        v-if="loginError"
        class="absolute bottom-4 left-1/2 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-md border border-error-border bg-surface px-4 py-3 text-sm text-error-strong shadow"
        style="
          background-image: linear-gradient(
            var(--color-error-soft),
            var(--color-error-soft)
          );
        "
        role="alert"
      >
        {{ loginError }}
      </p>
    </div>
  </Teleport>
</template>
