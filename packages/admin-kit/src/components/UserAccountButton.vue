<script setup lang="ts">
import { LogOutOutlined } from '@vicons/material';
import {
  NButton,
  NDropdown,
  NIcon,
  NText,
  NTime,
  type MenuOption,
} from 'naive-ui';
import { computed, h } from 'vue';
import { useRouter } from 'vue-router';

import { useAdminKit } from '../context';
import { ADMIN_LOGIN_ROUTE_NAME } from '../router';

const roleLabels: Record<string, string> = {
  admin: '管理员',
  trusted: '受信任用户',
  member: '成员',
  restricted: '受限用户',
  banned: '已封禁用户',
};

const { session } = useAdminKit();
const router = useRouter();

const dropdownOptions = computed<MenuOption[]>(() => [
  {
    key: 'profile',
    type: 'render',
    render: () =>
      h('div', { style: { padding: '6px 12px 8px' } }, [
        h(
          NText,
          { style: { display: 'block' } },
          {
            default: () => {
              const role = session.profile.value?.role;
              return role ? (roleLabels[role] ?? role) : '未知角色';
            },
          },
        ),
        h(
          NText,
          { depth: 3, style: { fontSize: '12px' } },
          {
            default: () => [
              '注册于 ',
              h(NTime, {
                time: (session.profile.value?.createdAt ?? 0) * 1000,
                type: 'date',
              }),
            ],
          },
        ),
      ]),
  },
  { key: 'profile-divider', type: 'divider' },
  {
    label: '退出账号',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutlined) }),
  },
]);

async function handleSelect(key: string | number) {
  if (key !== 'logout') return;
  await session.logout();
  await router.replace({ name: ADMIN_LOGIN_ROUTE_NAME });
}
</script>

<template>
  <div class="user-account-button">
    <n-dropdown
      v-if="session.isSignedIn.value"
      trigger="hover"
      placement="bottom-end"
      :keyboard="false"
      :options="dropdownOptions"
      @select="handleSelect"
    >
      <n-button quaternary :focusable="false">
        @{{ session.profile.value?.username }}
      </n-button>
    </n-dropdown>
  </div>
</template>

<style scoped>
.user-account-button {
  flex: none;
}
</style>
