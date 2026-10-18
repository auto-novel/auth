<script setup lang="ts">
import { Inventory2Outlined } from '@vicons/material';
import { computed } from 'vue';

import XButton from '../button/XButton.vue';
import type { XAsyncContentProps } from './types';

const props = withDefaults(defineProps<XAsyncContentProps>(), {
  error: '',
  empty: false,
  errorTitle: '加载失败',
  retryLabel: '再试一次',
  emptyTitle: '暂无内容',
  size: 'default',
});

defineSlots<{
  default?(): unknown;
  loading?(): unknown;
  error?(props: { error: string; retry: (() => void) | undefined }): unknown;
  empty?(): unknown;
}>();

const layout = computed(() =>
  props.size === 'compact'
    ? {
        minHeight: 'min-h-52',
        padding: 'p-6',
        heading: 'mt-3 text-sm font-medium text-ink',
        description: 'mt-1 text-xs text-muted',
        retry: 'mt-4',
      }
    : {
        minHeight: props.size === 'large' ? 'min-h-96' : 'min-h-80',
        padding: 'p-8',
        heading: 'mt-4 text-lg font-semibold text-ink',
        description: 'mt-2 text-sm text-muted',
        retry: 'mt-5',
      },
);
</script>

<template>
  <div class="contents">
    <slot v-if="loading" name="loading">
      <div
        class="grid place-items-center gap-3 py-9 text-sm text-muted"
        role="status"
      >
        <span
          class="size-8 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span>正在加载…</span>
      </div>
    </slot>

    <slot v-else-if="error" name="error" :error="error" :retry="onRetry">
      <div
        class="grid place-items-center text-center"
        :class="[layout.minHeight, layout.padding]"
      >
        <div>
          <div
            class="mx-auto grid size-12 place-items-center rounded-full bg-error-soft text-error-strong"
            aria-hidden="true"
          >
            !
          </div>

          <h2 v-if="errorTitle" :class="layout.heading">
            {{ errorTitle }}
          </h2>
          <p class="mt-2 text-sm text-muted">
            {{ error }}
          </p>
          <XButton v-if="onRetry" :class="layout.retry" @click="onRetry()">
            {{ retryLabel }}
          </XButton>
        </div>
      </div>
    </slot>
    <slot v-else-if="empty" name="empty">
      <div
        class="grid place-items-center text-center"
        :class="[layout.minHeight, layout.padding]"
      >
        <div>
          <div
            class="mx-auto grid size-12 place-items-center rounded-full bg-paper text-muted"
            aria-hidden="true"
          >
            <Inventory2Outlined class="size-6" />
          </div>

          <h2 :class="layout.heading">
            {{ emptyTitle }}
          </h2>
          <p v-if="emptyDescription" :class="layout.description">
            {{ emptyDescription }}
          </p>
        </div>
      </div>
    </slot>
    <slot v-else />
  </div>
</template>
