<script setup lang="ts">
import { formatISO } from 'date-fns';
import { computed } from 'vue';

import {
  formatTimeValue,
  TIME_DEFAULT_FORMAT,
  timeValueToDate,
} from '../utils/time';
import type { XTimeProps } from './types';

const props = withDefaults(defineProps<XTimeProps>(), {
  format: TIME_DEFAULT_FORMAT,
});

const date = computed(() => timeValueToDate(props.time));
const text = computed(() =>
  date.value ? formatTimeValue(date.value, props.format, props.to) : '',
);
const machineTime = computed(() => (date.value ? formatISO(date.value) : ''));
</script>

<template>
  <time v-if="date" :datetime="machineTime">{{ text }}</time>
</template>
