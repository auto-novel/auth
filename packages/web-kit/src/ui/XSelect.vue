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

defineProps<{
  options: { label: string; value: string }[];
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
  required?: boolean;
  rounded?: boolean;
}>();

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
        class="flex min-h-10 w-full min-w-0 items-center justify-between gap-2 border border-border bg-transparent px-3 text-left text-sm font-normal text-ink outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
        :class="rounded ? 'rounded-md' : 'rounded-sm'"
      >
        <SelectValue class="min-w-0 truncate" />
        <ExpandMoreOutlined
          class="size-4 shrink-0 text-muted"
          aria-hidden="true"
        />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          position="popper"
          :side-offset="6"
          class="z-40 max-h-60 min-w-(--reka-select-trigger-width) overflow-hidden rounded-md border border-border bg-surface p-1 text-ink shadow-xl"
        >
          <SelectViewport>
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              class="relative flex cursor-default items-center rounded-sm py-2 pr-3 pl-8 text-sm outline-none select-none data-[highlighted]:bg-paper data-[highlighted]:text-ink"
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
