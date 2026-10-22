<script setup lang="ts">
import { XButton, XInput } from '@novelia/web-kit';
import { SearchOutlined } from '@vicons/material';

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
      <XInput
        v-model="operatorUsername"
        class="w-[min(400px,100%)]!"
        clearable
        placeholder="操作者用户名"
        @change="$emit('search')"
        @keydown.enter="!$event.isComposing && $emit('search')"
        @clear="$emit('search')"
      >
        <template #suffix>
          <SearchOutlined class="size-5" aria-hidden="true" />
        </template>
      </XInput>
    </FilterRow>

    <FilterRow label="目标用户">
      <XInput
        v-model="username"
        class="w-[min(400px,100%)]!"
        clearable
        placeholder="目标用户名"
        @change="$emit('search')"
        @keydown.enter="!$event.isComposing && $emit('search')"
        @clear="$emit('search')"
      >
        <template #suffix>
          <SearchOutlined class="size-5" aria-hidden="true" />
        </template>
      </XInput>
    </FilterRow>

    <FilterRow label="时间">
      <TimeRangeFilter
        :model-value="createdRange"
        @update:model-value="changeCreatedRange"
      />
    </FilterRow>

    <div class="flex justify-end gap-3">
      <XButton
        class="h-[34px] min-h-0 rounded-[3px] px-3.5 font-normal [@media(max-width:767px)]:flex-1"
        color="warning"
        @click="$emit('create')"
      >
        新增警告
      </XButton>
    </div>
  </div>
</template>
