<script setup lang="ts">
interface Props {
  rules?: (value: string) => string | true;
}

const props = withDefaults(defineProps<Props>(), {
  rules: undefined,
});

const root = ref<HTMLElement>();
const validateError = ref('');

/** Re-runs the rules and reports whether the field is currently valid. */
function validate() {
  if (!root.value) return true;

  const input = root.value.getElementsByTagName('input').item(0);
  if (!input) {
    validateError.value = '';
    return true;
  }

  if (props.rules) {
    const result = props.rules(input.value);
    validateError.value = result === true ? '' : `* ${result}`;
  } else {
    validateError.value = '';
  }
  input.setCustomValidity(validateError.value);
  return validateError.value === '';
}

defineExpose({ validate });
</script>

<template>
  <div class="relative w-auto">
    <div ref="root" class="flex" @input="validate" @blur="validate">
      <slot />
    </div>
    <div class="mt-1 text-left text-xs text-error">
      {{ validateError }}
    </div>
  </div>
</template>
