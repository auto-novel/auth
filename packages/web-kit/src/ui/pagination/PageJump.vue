<script setup lang="ts">
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui';
import { computed, ref, watch } from 'vue';

import XButton from '../XButton.vue';
import { useOverlayLayer } from '../overlayLayer';

const props = defineProps<{
  open: boolean;
  page: number;
  totalPages: number;
  contentClass?: string;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  change: [page: number];
}>();

const { contentStyle } = useOverlayLayer(() => props.open);
const jumpPage = ref<number | string>(props.page);
const canJump = computed(() => {
  const target = Number(jumpPage.value);
  return (
    Number.isInteger(target) &&
    target >= 1 &&
    target <= props.totalPages &&
    target !== props.page
  );
});

watch([() => props.open, () => props.page, () => props.totalPages], () => {
  jumpPage.value = props.page;
});

function jumpToPage() {
  if (!canJump.value) return;
  emit('change', Number(jumpPage.value));
  emit('update:open', false);
}
</script>

<template>
  <PopoverRoot :open="open" @update:open="$emit('update:open', $event)">
    <PopoverTrigger as-child>
      <slot />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :style="contentStyle"
        :side-offset="6"
        :collision-padding="8"
        class="floating-panel flex items-center gap-2 p-3 outline-none"
        :class="contentClass"
        aria-label="跳转到指定页"
      >
        <label class="flex items-center gap-2 text-xs text-muted">
          跳至
          <input
            v-model="jumpPage"
            type="number"
            inputmode="numeric"
            min="1"
            :max="totalPages"
            step="1"
            :disabled="totalPages < 1"
            aria-label="跳转页码"
            class="h-9 w-16 rounded-sm border border-border bg-transparent px-2 text-sm text-ink outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
            @keydown.enter.prevent="jumpToPage"
          />
          页
        </label>
        <XButton
          variant="outline"
          size="sm"
          :disabled="!canJump"
          @click="jumpToPage"
        >
          跳转
        </XButton>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
