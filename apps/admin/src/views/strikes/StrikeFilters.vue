<script setup lang="ts">
import { SearchOutlined } from '@vicons/material';
import { NButton, NDatePicker, NIcon, NInput, NInputNumber } from 'naive-ui';

defineEmits<{
  search: [];
  create: [];
}>();

const username = defineModel<string>('username', { required: true });
const operatorId = defineModel<number | null>('operatorId', { required: true });
const createdRange = defineModel<[number, number] | null>('createdRange', {
  required: true,
});
</script>

<template>
  <div class="filters">
    <n-input
      v-model:value="username"
      class="username-input"
      clearable
      placeholder="目标用户名"
      @keyup.enter="$emit('search')"
    >
      <template #prefix>
        <n-icon :component="SearchOutlined" />
      </template>
    </n-input>
    <n-input-number
      v-model:value="operatorId"
      class="operator-input"
      clearable
      :min="1"
      :precision="0"
      placeholder="操作者 ID"
      @keyup.enter="$emit('search')"
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
    <n-button class="create-button" type="warning" @click="$emit('create')">
      新增警告
    </n-button>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 150px 280px auto auto;
  gap: 12px;
  align-items: center;
}

@media (max-width: 1050px) {
  .filters {
    grid-template-columns: minmax(180px, 1fr) 150px auto auto;
  }

  .created-range {
    width: 100%;
    grid-column: 1 / 3;
    grid-row: 2;
  }

  .search-button,
  .create-button {
    grid-row: 2;
  }
}

@media (max-width: 767px) {
  .filters {
    grid-template-columns: minmax(0, 1fr) 1fr;
  }

  .username-input,
  .operator-input,
  .created-range {
    width: 100%;
    grid-column: 1 / -1;
    grid-row: auto;
  }

  .search-button,
  .create-button {
    width: 100%;
    grid-row: auto;
  }
}
</style>
