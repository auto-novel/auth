<script setup lang="ts">
import {
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui';

import { computed, ref, watch } from 'vue';

import XButton from './XButton.vue';
import type { XPaginationProps } from './types';

const props = defineProps<XPaginationProps>();

const emit = defineEmits<{
  change: [page: number];
}>();

const openJumpIndex = ref<number | null>(null);
const jumpPage = ref<number | string>(props.page);

function setJumpOpen(open: boolean, index: number) {
  openJumpIndex.value = open ? index : null;
  if (open) jumpPage.value = props.page;
}
const canJump = computed(() => {
  const target = Number(jumpPage.value);
  return (
    Number.isInteger(target) &&
    target >= 1 &&
    target <= props.totalPages &&
    target !== props.page
  );
});

watch([() => props.page, () => props.totalPages], () => {
  jumpPage.value = props.page;
  openJumpIndex.value = null;
});

function jumpToPage() {
  if (canJump.value) {
    emit('change', Number(jumpPage.value));
    openJumpIndex.value = null;
  }
}
</script>

<template>
  <PaginationRoot
    :page="page"
    :total="totalPages"
    :items-per-page="1"
    :sibling-count="1"
    show-edges
    class="flex items-center justify-between border-t border-divider px-4 py-3 text-sm sm:px-6"
    aria-label="分页"
    @update:page="$emit('change', $event)"
  >
    <PaginationPrev as-child>
      <XButton variant="outline" size="sm">上一页</XButton>
    </PaginationPrev>

    <span class="text-xs text-muted sm:hidden">
      {{ page }} / {{ totalPages }}
    </span>
    <PaginationList
      v-slot="{ items }"
      class="hidden items-center gap-1 sm:flex"
    >
      <template v-for="(item, index) in items" :key="index">
        <PaginationListItem
          v-if="item.type === 'page'"
          :value="item.value"
          as-child
        >
          <XButton
            variant="ghost"
            size="icon-sm"
            class="text-xs font-medium data-selected:bg-primary data-selected:text-on-primary data-selected:hover:bg-primary-hover data-selected:hover:text-on-primary"
          >
            {{ item.value }}
          </XButton>
        </PaginationListItem>
        <PopoverRoot
          v-else
          :open="openJumpIndex === index"
          @update:open="setJumpOpen($event, index)"
        >
          <PopoverTrigger as-child>
            <XButton
              variant="ghost"
              size="icon-sm"
              class="text-xs text-muted"
              aria-label="跳转到指定页"
              title="跳转到指定页"
            >
              …
            </XButton>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              :side-offset="6"
              :collision-padding="8"
              class="floating-panel z-40 flex items-center gap-2 p-3 outline-none"
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
    </PaginationList>

    <PaginationNext as-child>
      <XButton variant="outline" size="sm">下一页</XButton>
    </PaginationNext>
  </PaginationRoot>
</template>
