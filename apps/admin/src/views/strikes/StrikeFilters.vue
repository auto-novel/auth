<script setup lang="ts">
import { SearchOutlined } from '@vicons/material';
import { NButton, NIcon, NInput } from 'naive-ui';

import FilterRow from '@/components/FilterRow.vue';
import TimeRangeFilter from '@/components/TimeRangeFilter.vue';

const emit = defineEmits<{
  search: [];
  create: [];
}>();

const username = defineModel<string>('username', { required: true });
const operatorUsername = defineModel<string>('operatorUsername', {
  required: true,
});
const createdRange = defineModel<[number, number] | null>('createdRange', {
  required: true,
});

function changeCreatedRange(value: [number, number] | null) {
  createdRange.value = value;
  emit('search');
}
</script>

<template>
  <div class="grid w-full grid-cols-1 gap-4">
    <FilterRow label="操作者">
      <n-input
        v-model:value="operatorUsername"
        class="w-[min(400px,100%)]!"
        clearable
        placeholder="操作者用户名"
        @change="$emit('search')"
      >
        <template #suffix>
          <n-icon :component="SearchOutlined" />
        </template>
      </n-input>
    </FilterRow>

    <FilterRow label="目标用户">
      <n-input
        v-model:value="username"
        class="w-[min(400px,100%)]!"
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

    <div class="flex justify-end gap-3">
      <n-button
        class="[@media(max-width:767px)]:flex-1"
        type="warning"
        @click="$emit('create')"
      >
        新增警告
      </n-button>
    </div>
  </div>
</template>
