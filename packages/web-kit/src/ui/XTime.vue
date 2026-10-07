<script setup lang="ts">
import { formatISO } from 'date-fns';
import { computed } from 'vue';

import {
  formatRelativeTime,
  formatTimeValue,
  TIME_PRESETS,
  timeValueToDate,
} from '../utils/time';
import type { XTimeProps } from './types';

const props = withDefaults(defineProps<XTimeProps>(), {
  preset: 'datetime',
});

const date = computed(() => timeValueToDate(props.time));
const text = computed(() => {
  const value = date.value;
  if (!value) return '';

  if (props.format) return formatTimeValue(value, props.format);

  return props.preset === 'relative'
    ? formatRelativeTime(value, props.to)
    : formatTimeValue(value, TIME_PRESETS[props.preset]);
});
const machineTime = computed(() => (date.value ? formatISO(date.value) : ''));
const title = computed(
  () =>
    props.title ??
    (date.value ? formatTimeValue(date.value, 'yyyy年M月d日 HH:mm:ss') : ''),
);
</script>

<template>
  <time v-if="date" :datetime="machineTime" :title="title">{{ text }}</time>
</template>
