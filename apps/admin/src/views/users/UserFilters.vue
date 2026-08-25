<script setup lang="ts">
import { SearchOutlined } from '@vicons/material';
import { NIcon, NInput } from 'naive-ui';

import FilterChoiceGroup from '@/components/FilterChoiceGroup.vue';
import FilterRow from '@/components/FilterRow.vue';
import TimeRangeFilter from '@/components/TimeRangeFilter.vue';

const emit = defineEmits<{
  search: [];
}>();

const query = defineModel<string>('query', { required: true });
const role = defineModel<string | null>('role', { required: true });
const createdRange = defineModel<[number, number] | null>('createdRange', {
  required: true,
});

const roleOptions = [
  { label: '全部', value: '' },
  { label: '管理员', value: 'admin' },
  { label: '可信用户', value: 'trusted' },
  { label: '普通用户', value: 'member' },
  { label: '受限用户', value: 'restricted' },
  { label: '已封禁', value: 'banned' },
];

function changeRole(value: string) {
  role.value = value || null;
  emit('search');
}

function changeCreatedRange(value: [number, number] | null) {
  createdRange.value = value;
  emit('search');
}
</script>

<template>
  <div class="filters">
    <FilterRow label="搜索">
      <n-input
        v-model:value="query"
        class="query-input"
        clearable
        placeholder="搜索用户名或邮箱"
        @change="$emit('search')"
      >
        <template #suffix>
          <n-icon :component="SearchOutlined" />
        </template>
      </n-input>
    </FilterRow>

    <FilterRow label="角色">
      <FilterChoiceGroup
        :value="role ?? ''"
        :options="roleOptions"
        @update:value="changeRole"
      />
    </FilterRow>

    <FilterRow label="注册时间">
      <TimeRangeFilter
        :model-value="createdRange"
        @update:model-value="changeCreatedRange"
      />
    </FilterRow>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.query-input {
  width: min(400px, 100%);
}
</style>
