<script setup lang="ts">
import { LogOutOutlined } from '@vicons/material';
import {
  NButton,
  NDropdown,
  NIcon,
  NTag,
  NText,
  NTime,
  type MenuOption,
} from 'naive-ui';
import { computed, h } from 'vue';
import { useRouter } from 'vue-router';

import { USER_ROLE_LABELS } from '@/auth/roles';
import { useAuthSession } from '@/auth/session';

const authSession = useAuthSession();
const router = useRouter();

const dropdownOptions = computed<MenuOption[]>(() => [
  {
    key: 'profile',
    type: 'render',
    render: () =>
      h(
        'div',
        {
          style: {
            minWidth: '176px',
            padding: '6px 12px 8px',
          },
        },
        [
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '6px',
              },
            },
            [
              h(
                NText,
                { depth: 3, style: { fontSize: '12px' } },
                { default: () => '账号角色' },
              ),
              h(
                NTag,
                { bordered: false, round: true, size: 'small', type: 'info' },
                {
                  default: () =>
                    authSession.profile.value
                      ? USER_ROLE_LABELS[authSession.profile.value.role]
                      : '未知角色',
                },
              ),
            ],
          ),
          h(
            NText,
            { depth: 3, style: { fontSize: '12px' } },
            {
              default: () => [
                '注册于 ',
                h(NTime, {
                  time: (authSession.profile.value?.createdAt ?? 0) * 1000,
                  type: 'date',
                }),
              ],
            },
          ),
        ],
      ),
  },
  { key: 'profile-divider', type: 'divider' },
  {
    label: '退出账号',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutlined) }),
  },
]);

async function handleSelect(key: string | number) {
  if (key === 'logout') {
    await authSession.logout();
    await router.replace({ name: 'login' });
  }
}
</script>

<template>
  <div class="user-account-button">
    <n-dropdown
      v-if="authSession.isSignedIn.value"
      trigger="hover"
      placement="bottom-end"
      :keyboard="false"
      :options="dropdownOptions"
      @select="handleSelect"
    >
      <n-button quaternary :focusable="false">
        @{{ authSession.profile.value?.username }}
      </n-button>
    </n-dropdown>
  </div>
</template>

<style scoped>
.user-account-button {
  flex: none;
}
</style>
