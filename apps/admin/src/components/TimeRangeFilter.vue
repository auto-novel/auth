<script setup lang="ts">
import { NDatePicker } from 'naive-ui';
import { ref, watch } from 'vue';

import FilterChoiceGroup from './FilterChoiceGroup.vue';

type TimeRangePreset =
  'all' | 'today' | 'last-7-days' | 'last-30-days' | 'custom';

const range = defineModel<[number, number] | null>({ required: true });

const presets: { label: string; value: TimeRangePreset }[] = [
  { label: '全部', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '近 7 天', value: 'last-7-days' },
  { label: '近 30 天', value: 'last-30-days' },
  { label: '自定义', value: 'custom' },
];

const selectedPreset = ref<TimeRangePreset>(range.value ? 'custom' : 'all');

function getRecentDaysRange(days: number): [number, number] {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return [start.getTime(), end.getTime()];
}

function selectPreset(value: string) {
  const preset = value as TimeRangePreset;
  selectedPreset.value = preset;

  if (preset === 'all') {
    range.value = null;
  } else if (preset === 'today') {
    range.value = getRecentDaysRange(1);
  } else if (preset === 'last-7-days') {
    range.value = getRecentDaysRange(7);
  } else if (preset === 'last-30-days') {
    range.value = getRecentDaysRange(30);
  }
}

watch(range, (value) => {
  if (value === null) selectedPreset.value = 'all';
});
</script>

<template>
  <div class="time-range-filter">
    <FilterChoiceGroup
      :value="selectedPreset"
      :options="presets"
      @update:value="selectPreset"
    />

    <n-date-picker
      v-if="selectedPreset === 'custom'"
      v-model:value="range"
      class="custom-range"
      type="daterange"
      clearable
      start-placeholder="开始日期"
      end-placeholder="结束日期"
    />
  </div>
</template>

<style scoped>
.time-range-filter {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: 12px;
}

.custom-range {
  width: 280px;
}

@media (max-width: 767px) {
  .custom-range {
    width: 100%;
  }
}
</style>
