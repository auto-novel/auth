<script setup lang="ts">
import {
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
import { computed, ref, watch } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';

import { useWebKit, useWebKitInternals } from '../../context';
import type { WebKitMenuOption } from '../../types';
import XTime from '../../ui/time/XTime.vue';
import AccountMenuOptions from './AccountMenuOptions.vue';
import AccountMenuPanel from './AccountMenuPanel.vue';
import LoginDialog from './LoginDialog.vue';

defineProps<{ options: WebKitMenuOption[] }>();

const { logout: signOut, whoami } = useWebKit();
const { attention, options: kitOptions, accountActions } = useWebKitInternals();
const menuOpen = ref(false);
const loginOpen = ref(false);
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

watch(menuOpen, (open) => {
  if (open) void attention.refresh();
});

async function logout() {
  menuOpen.value = false;
  try {
    await signOut();
  } catch {
    // The auth session clears the local session even if the remote session has expired.
  }
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
            class="account-chevron size-4 flex-none"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          as-child
          align="end"
          :side-offset="8"
          :collision-padding="8"
        >
          <AccountMenuPanel class="pt-0">
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
          </AccountMenuPanel>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>

    <button
      v-else
      type="button"
      class="account-trigger"
      @click="loginOpen = true"
    >
      登录/注册
    </button>
  </div>

  <LoginDialog v-model:open="loginOpen" />
</template>

<style scoped>
.account-trigger {
  display: flex;
  min-height: 2.25rem;
  align-items: center;
  gap: 0.25rem;
  border-radius: 0.1875rem;
  padding-inline: 0.75rem;
  color: var(--color-ink);
  font-size: 0.875rem;
  font-weight: 400;
  transition: background-color 150ms ease;

  &:hover {
    background: var(--color-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.account-chevron {
  transition: transform 180ms cubic-bezier(0.2, 0, 0, 1);
}

.account-trigger[data-state='open'] .account-chevron {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .account-chevron {
    transition: none;
  }
}
</style>
