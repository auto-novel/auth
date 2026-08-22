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

const query = defineModel<string>('query', { required: true });
const role = defineModel<string | null>('role', { required: true });
const createdRange = defineModel<[number, number] | null>('createdRange', {
  required: true,
});

const roleOptions: SelectOption[] = [
  { label: '管理员', value: 'admin' },
  { label: '可信用户', value: 'trusted' },
  { label: '普通用户', value: 'member' },
  { label: '受限用户', value: 'restricted' },
  { label: '已封禁', value: 'banned' },
];
</script>

<template>
  <div class="filters">
    <n-input
      v-model:value="query"
      class="query-input"
      clearable
      placeholder="搜索用户名或邮箱"
      @keyup.enter="$emit('search')"
    >
      <template #prefix>
        <n-icon :component="SearchOutlined" />
      </template>
    </n-input>
    <n-select
      v-model:value="role"
      class="role-select"
      clearable
      :options="roleOptions"
      placeholder="全部角色"
    />
    <n-date-picker
      v-model:value="createdRange"
      class="created-range"
      type="daterange"
      clearable
      start-placeholder="注册开始日期"
      end-placeholder="注册结束日期"
    />
    <n-button
      class="search-button"
      type="primary"
      @click="$emit('search')"
    >
      查询
    </n-button>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  width: 100%;
  gap: 12px;
  align-items: center;
}

.query-input {
  width: auto;
  min-width: 220px;
  flex: 1;
}

.role-select {
  width: 180px;
  flex: none;
}

.created-range {
  width: 300px;
  flex: none;
}

@media (max-width: 1050px) {
  .filters {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 180px auto;
  }

  .query-input {
    width: 100%;
    grid-column: 1;
    grid-row: 1;
  }

  .role-select {
    grid-column: 2;
    grid-row: 1;
  }

  .created-range {
    width: 100%;
    grid-column: 1 / 3;
    grid-row: 2;
  }

  .search-button {
    grid-column: 3;
    grid-row: 2;
  }
}

@media (max-width: 767px) {
  .filters {
    grid-template-columns: minmax(0, 1fr);
  }

  .query-input,
  .role-select,
  .created-range,
  .search-button {
    grid-column: 1;
    grid-row: auto;
  }

  .query-input {
    min-width: 0;
  }

  .role-select {
    width: auto;
    min-width: 0;
  }
}
</style>
