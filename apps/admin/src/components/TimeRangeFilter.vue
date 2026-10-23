<script setup lang="ts">
import { XDateRangePicker, type XDateRange } from '@novelia/web-kit';
import { computed, ref, watch } from 'vue';

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
let pendingInternalRange: string | undefined;

function formatIsoDate(timestamp: number) {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIsoDate(value: string) {
  const [year = 1970, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}

function getRecentDaysRange(days: number): [number, number] {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return [start.getTime(), end.getTime()];
}

function getRangeKey(value: [number, number] | null) {
  return value === null ? '' : value.join(':');
}

function updateRange(value: [number, number] | null) {
  pendingInternalRange = getRangeKey(value);
  range.value = value;
}

/** 日历只接受本地日期，筛选侧仍沿用毫秒时间戳。 */
const customRange = computed<XDateRange | null>({
  get: (): XDateRange | null =>
    range.value
      ? [formatIsoDate(range.value[0]), formatIsoDate(range.value[1])]
      : null,
  set: (value: XDateRange | null) => {
    if (!value) {
      updateRange(null);
      return;
    }
    updateRange([parseIsoDate(value[0]), parseIsoDate(value[1])]);
  },
});

function selectPreset(value: string) {
  const preset = value as TimeRangePreset;
  selectedPreset.value = preset;

  if (preset === 'all') {
    updateRange(null);
  } else if (preset === 'today') {
    updateRange(getRecentDaysRange(1));
  } else if (preset === 'last-7-days') {
    updateRange(getRecentDaysRange(7));
  } else if (preset === 'last-30-days') {
    updateRange(getRecentDaysRange(30));
  }
}

watch(range, (value) => {
  if (pendingInternalRange === getRangeKey(value)) {
    pendingInternalRange = undefined;
    return;
  }
  pendingInternalRange = undefined;
  selectedPreset.value = value === null ? 'all' : 'custom';
});
</script>

<template>
  <div class="grid w-full min-w-0 gap-3">
    <FilterChoiceGroup
      :value="selectedPreset"
      :options="presets"
      @update:value="selectPreset"
    />

    <XDateRangePicker
      v-if="selectedPreset === 'custom'"
      v-model="customRange"
      class="w-[280px] max-md:w-full"
      clearable
      placeholder="开始日期 至 结束日期"
      aria-label="筛选时间区间"
    />
  </div>
</template>
