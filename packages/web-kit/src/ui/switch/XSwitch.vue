<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui';
import type { XSwitchProps } from './types';

defineProps<XSwitchProps>();

const model = defineModel<boolean>({ default: false });
const emit = defineEmits<{ change: [] }>();

function updateValue(value: boolean) {
  model.value = value;
  emit('change');
}
</script>

<template>
  <SwitchRoot
    :model-value="model"
    :disabled="disabled"
    :required="required"
    :name="name"
    :value="value"
    class="inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-border align-middle outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary motion-reduce:transition-none"
    @update:model-value="updateValue"
  >
    <SwitchThumb
      class="pointer-events-none block size-4 translate-x-0 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 rtl:data-[state=checked]:-translate-x-4 motion-reduce:transition-none"
    />
  </SwitchRoot>
</template>
