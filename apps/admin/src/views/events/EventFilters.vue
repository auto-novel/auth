<script setup lang="ts">
import { SearchOutlined } from '@vicons/material';
import {
  NButton,
  NDatePicker,
  NIcon,
  NInput,
  NSelect,
  type SelectOption,
} from 'naive-ui';

defineEmits<{
  search: [];
}>();

const actor = defineModel<string>('actor', { required: true });
const target = defineModel<string>('target', { required: true });
const action = defineModel<string | null>('action', { required: true });
const createdRange = defineModel<[number, number] | null>('createdRange', {
  required: true,
});

const actionOptions: SelectOption[] = [
  { label: '登录', value: 'login' },
  { label: '注册', value: 'register' },
  { label: '退出登录', value: 'logout' },
  { label: '发送验证码', value: 'otp' },
  { label: '重置密码', value: 'reset_password' },
  { label: '限制用户', value: 'restrict-user' },
  { label: '封禁用户', value: 'ban-user' },
  { label: '警告用户', value: 'strike-user' },
];
</script>

<template>
  <div class="filters">
    <n-input
      v-model:value="actor"
      class="user-input"
      clearable
      placeholder="操作者用户名"
      @keyup.enter="$emit('search')"
    >
      <template #prefix>
        <n-icon :component="SearchOutlined" />
      </template>
    </n-input>
    <n-input
      v-model:value="target"
      class="user-input"
      clearable
      placeholder="目标用户名"
      @keyup.enter="$emit('search')"
    />
    <n-select
      v-model:value="action"
      class="action-select"
      clearable
      :options="actionOptions"
      placeholder="全部事件"
    />
    <n-date-picker
      v-model:value="createdRange"
      class="created-range"
      type="daterange"
      clearable
      start-placeholder="开始日期"
      end-placeholder="结束日期"
    />
    <n-button class="search-button" type="primary" @click="$emit('search')">
      查询
    </n-button>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(150px, 1fr) 150px 280px auto;
  gap: 12px;
  align-items: center;
}

@media (max-width: 1050px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr)) 150px auto;
  }

  .created-range {
    width: 100%;
    grid-column: 1 / 3;
  }
}

@media (max-width: 767px) {
  .filters {
    grid-template-columns: minmax(0, 1fr);
  }

  .user-input,
  .action-select,
  .created-range,
  .search-button {
    width: 100%;
    grid-column: 1;
  }
}
</style>
