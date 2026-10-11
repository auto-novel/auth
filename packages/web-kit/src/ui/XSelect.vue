<script setup lang="ts">
import { CheckOutlined, ExpandMoreOutlined } from '@vicons/material';
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  type AcceptableValue,
} from 'reka-ui';

import type { XSelectProps } from './types';

defineProps<XSelectProps>();

const model = defineModel<string>({ required: true });
const emit = defineEmits<{ change: [] }>();

function handleChange(value: AcceptableValue) {
  if (typeof value !== 'string') return;
  model.value = value;
  emit('change');
}
</script>

<template>
  <div>
    <SelectRoot
      :model-value="model"
      :disabled="disabled"
      :required="required"
      @update:model-value="handleChange"
    >
      <SelectTrigger
        :id="id"
        :aria-label="ariaLabel"
        class="x-select-trigger flex min-h-10 w-full min-w-0 items-center justify-between gap-2 border border-border bg-transparent px-3 text-left text-sm font-normal text-ink outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
        :class="rounded ? 'rounded-md' : 'rounded-sm'"
      >
        <SelectValue class="min-w-0 truncate" />
        <ExpandMoreOutlined
          class="x-select-chevron size-4 shrink-0 text-muted"
          aria-hidden="true"
        />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          position="popper"
          :side-offset="6"
          class="x-select-content floating-panel z-40 max-h-60 min-w-(--reka-select-trigger-width) overflow-hidden p-1 text-ink"
        >
          <SelectViewport>
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              class="menu-item relative cursor-default pl-8 select-none"
            >
              <SelectItemIndicator class="absolute left-2 text-primary">
                <CheckOutlined class="size-4" aria-hidden="true" />
              </SelectItemIndicator>
              <SelectItemText>{{ option.label }}</SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

<!-- The popper panel is not the component root, so scoped selectors miss it. -->
<style>
.x-select-chevron {
  transition: transform 180ms cubic-bezier(0.2, 0, 0, 1);
}

.x-select-trigger[data-state='open'] .x-select-chevron {
  transform: rotate(180deg);
}

.x-select-content {
  --select-enter-offset: -4px;
  transform-origin: var(--reka-select-content-transform-origin);
}

.x-select-content[data-side='top'] {
  --select-enter-offset: 4px;
}

/* Reka Presence keeps the panel mounted until the exit animation ends. */
.x-select-content[data-state='open'] {
  animation: x-select-open 180ms cubic-bezier(0.2, 0, 0, 1);
}

.x-select-content[data-state='closed'] {
  pointer-events: none;
  animation: x-select-close 120ms ease-in forwards;
}

@keyframes x-select-open {
  from {
    opacity: 0;
    transform: translateY(var(--select-enter-offset)) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes x-select-close {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(var(--select-enter-offset)) scale(0.96);
  }
}

@media (prefers-reduced-motion: reduce) {
  .x-select-chevron {
    transition: none;
  }

  .x-select-content[data-state] {
    animation: none;
  }
}
</style>
