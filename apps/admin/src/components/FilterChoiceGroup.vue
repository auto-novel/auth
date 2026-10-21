<script setup lang="ts">
import { NFlex, NText } from 'naive-ui';

interface FilterChoiceOption {
  label: string;
  value: string;
}

const props = defineProps<{
  value: string | null;
  options: FilterChoiceOption[];
}>();

const emit = defineEmits<{
  'update:value': [value: string];
}>();

function select(value: string) {
  emit('update:value', value);
}

function selectWithKeyboard(event: KeyboardEvent, value: string) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  select(value);
}
</script>

<template>
  <n-flex :size="[16, 4]" role="radiogroup">
    <n-text
      v-for="option in options"
      :key="option.value"
      class="cursor-pointer select-none focus-visible:rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      :class="{ 'font-medium': props.value === option.value }"
      :type="props.value === option.value ? 'primary' : 'default'"
      role="radio"
      :aria-checked="props.value === option.value"
      tabindex="0"
      @click="select(option.value)"
      @keydown="selectWithKeyboard($event, option.value)"
    >
      {{ option.label }}
    </n-text>
  </n-flex>
</template>
