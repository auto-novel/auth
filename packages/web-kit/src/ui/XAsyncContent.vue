<script setup lang="ts">
import { Inventory2Outlined } from '@vicons/material';
import { computed } from 'vue';

import XButton from './XButton.vue';

const props = withDefaults(
  defineProps<{
    loading: boolean;
    error?: string;
    empty?: boolean;
    errorTitle?: string;
    retryLabel?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    size?: 'compact' | 'default' | 'large';
    headingTag?: 'h1' | 'h2' | 'p';
    stateClass?: string;
    errorIcon?: boolean;
  }>(),
  {
    error: '',
    empty: false,
    errorTitle: '加载失败',
    retryLabel: '再试一次',
    emptyTitle: '暂无内容',
    size: 'default',
    headingTag: 'h2',
    stateClass: '',
    errorIcon: true,
  },
);

defineEmits<{ retry: [] }>();

const minHeightClass = computed(
  () =>
    ({
      compact: 'min-h-52',
      default: 'min-h-80',
      large: 'min-h-96',
    })[props.size],
);
const statePaddingClass = computed(() =>
  props.size === 'compact' ? 'p-6' : 'p-8',
);
const headingClass = computed(() =>
  props.size === 'compact'
    ? 'mt-3 text-sm font-medium text-ink'
    : 'mt-4 text-lg font-semibold text-ink',
);
const descriptionClass = computed(() =>
  props.size === 'compact'
    ? 'mt-1 text-xs text-muted'
    : 'mt-2 text-sm text-muted',
);
const retryClass = computed(() => (props.size === 'compact' ? 'mt-4' : 'mt-5'));
</script>

<template>
  <div class="contents">
    <slot v-if="loading" name="loading" />

    <div
      v-else-if="error"
      class="grid place-items-center text-center"
      :class="[minHeightClass, statePaddingClass, stateClass]"
    >
      <div>
        <slot v-if="errorIcon" name="error-icon">
          <div
            class="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-500"
            aria-hidden="true"
          >
            !
          </div>
        </slot>
        <component v-if="errorTitle" :is="headingTag" :class="headingClass">
          {{ errorTitle }}
        </component>
        <p
          class="text-sm text-muted"
          :class="errorIcon || errorTitle ? 'mt-2' : ''"
        >
          {{ error }}
        </p>
        <XButton :class="retryClass" @click="$emit('retry')">
          {{ retryLabel }}
        </XButton>
      </div>
    </div>

    <div
      v-else-if="empty"
      class="grid place-items-center text-center"
      :class="[minHeightClass, statePaddingClass, stateClass]"
    >
      <div>
        <slot name="empty-icon">
          <div
            class="mx-auto grid size-12 place-items-center rounded-full bg-paper text-muted"
            aria-hidden="true"
          >
            <Inventory2Outlined class="size-6" />
          </div>
        </slot>
        <component :is="headingTag" :class="headingClass">
          {{ emptyTitle }}
        </component>
        <p v-if="emptyDescription" :class="descriptionClass">
          {{ emptyDescription }}
        </p>
      </div>
    </div>

    <slot v-else />
  </div>
</template>
