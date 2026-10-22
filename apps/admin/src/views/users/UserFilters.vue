<script setup lang="ts">
import { XInput, roleLabels, roles } from '@novelia/web-kit';
import { SearchOutlined } from '@vicons/material';

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
  ...roles.map((value) => ({ label: roleLabels[value] ?? value, value })),
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
  <div class="grid w-full grid-cols-1 gap-4">
    <FilterRow label="搜索">
      <XInput
        v-model="query"
        class="w-[min(400px,100%)]!"
        clearable
        placeholder="搜索用户名或邮箱"
        @change="$emit('search')"
        @keydown.enter="!$event.isComposing && $emit('search')"
        @clear="$emit('search')"
      >
        <template #suffix>
          <SearchOutlined class="size-5" aria-hidden="true" />
        </template>
      </XInput>
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
