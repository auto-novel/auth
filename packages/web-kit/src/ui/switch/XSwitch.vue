<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui';

import { mergeClasses } from '../classes';

import type { XSwitchProps } from './types';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<Omit<XSwitchProps, 'modelValue'>>(), {
  ui: () => ({}),
});

const model = defineModel<boolean>({ default: false });
</script>

<template>
  <SwitchRoot
    v-bind="{ ...$attrs, class: undefined }"
    v-model="model"
    :disabled="disabled"
    :required="required"
    :name="name"
    :value="value"
    :class="
      mergeClasses(
        'inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-border align-middle outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary motion-reduce:transition-none',
        ui.root,
        $attrs.class,
      )
    "
  >
    <SwitchThumb
      :class="
        mergeClasses(
          'pointer-events-none block size-4 translate-x-0 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 rtl:data-[state=checked]:-translate-x-4 motion-reduce:transition-none',
          ui.thumb,
        )
      "
    />
  </SwitchRoot>
</template>
