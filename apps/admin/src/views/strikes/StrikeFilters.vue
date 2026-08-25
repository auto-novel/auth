<script setup lang="ts">
import { SearchOutlined } from '@vicons/material';
import { NButton, NIcon, NInput, NInputNumber } from 'naive-ui';

import FilterRow from '@/components/FilterRow.vue';
import TimeRangeFilter from '@/components/TimeRangeFilter.vue';

const emit = defineEmits<{
  search: [];
  create: [];
}>();

const username = defineModel<string>('username', { required: true });
const operatorId = defineModel<number | null>('operatorId', { required: true });
const createdRange = defineModel<[number, number] | null>('createdRange', {
  required: true,
});

function changeCreatedRange(value: [number, number] | null) {
  createdRange.value = value;
  emit('search');
}
</script>

<template>
  <div class="filters">
    <FilterRow label="操作者">
      <n-input-number
        v-model:value="operatorId"
        class="filter-input"
        clearable
        :min="1"
        :precision="0"
        placeholder="操作者 ID"
        @keyup.enter="$emit('search')"
        @blur="$emit('search')"
        @clear="$emit('search')"
      />
    </FilterRow>

    <FilterRow label="目标用户">
      <n-input
        v-model:value="username"
        class="filter-input"
        clearable
        placeholder="目标用户名"
        @change="$emit('search')"
      >
        <template #suffix>
          <n-icon :component="SearchOutlined" />
        </template>
      </n-input>
    </FilterRow>

    <FilterRow label="时间">
      <TimeRangeFilter
        :model-value="createdRange"
        @update:model-value="changeCreatedRange"
      />
    </FilterRow>

    <div class="filter-actions">
      <n-button type="warning" @click="$emit('create')">新增警告</n-button>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.filter-input {
  width: min(400px, 100%);
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 767px) {
  .filter-actions :deep(.n-button) {
    flex: 1;
  }
}
</style>
