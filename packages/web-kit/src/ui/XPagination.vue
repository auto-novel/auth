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

import { onKeyDown } from '@vueuse/core';
import {
  computed,
  onActivated,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue';

import XButton from './XButton.vue';
import type { XPaginationProps } from './types';

const props = defineProps<XPaginationProps>();

const emit = defineEmits<{
  change: [page: number];
}>();

const openJumpIndex = ref<number | null>(null);
const jumpPage = ref<number | string>(props.page);

const active = ref(false);
onMounted(() => {
  active.value = true;
});
onActivated(() => {
  active.value = true;
});
onDeactivated(() => {
  active.value = false;
});

const keyboardEnabled = () =>
  active.value && props.keyboard && openJumpIndex.value === null;
onKeyDown(
  ['ArrowLeft', 'ArrowRight'],
  (event) => {
    if (
      !keyboardEnabled() ||
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;

    const document = (event.currentTarget as Window | null)?.document;
    const ElementClass = document?.defaultView?.Element;
    const interactiveSelector =
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"], [role="tablist"], [role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"]';
    if (
      (ElementClass &&
        event
          .composedPath()
          .some(
            (target) =>
              target instanceof ElementClass &&
              (target.closest(interactiveSelector) ||
                (target as HTMLElement).isContentEditable),
          )) ||
      document?.querySelector(
        'dialog[open], [role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [aria-modal="true"]:not([hidden]):not([data-state="closed"])',
      )
    )
      return;

    const { page, totalPages } = props;
    const nextPage = page + (event.key === 'ArrowLeft' ? -1 : 1);
    if (
      !Number.isInteger(page) ||
      !Number.isInteger(totalPages) ||
      page < 1 ||
      page > totalPages ||
      nextPage < 1 ||
      nextPage > totalPages
    )
      return;

    event.preventDefault();
    emit('change', nextPage);
  },
  {
    // 忽略长按产生的重复事件，每次按下只翻一页。
    dedupe: true,
    // VueUse 自动清理；停用、关闭快捷键或打开跳页弹窗时移除监听。
    target: () =>
      keyboardEnabled() && typeof window !== 'undefined' ? window : undefined,
  },
);

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
      <XButton variant="ghost" size="sm">上一页</XButton>
    </PaginationPrev>

    <PopoverRoot
      :open="openJumpIndex === -1"
      @update:open="setJumpOpen($event, -1)"
    >
      <PopoverTrigger as-child>
        <XButton
          variant="ghost"
          size="sm"
          class="text-xs text-muted sm:hidden"
          :disabled="totalPages < 1"
          :aria-label="`当前第 ${page} 页，共 ${totalPages} 页，跳转到指定页`"
          title="跳转到指定页"
        >
          {{ page }} / {{ totalPages }}
        </XButton>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          :side-offset="6"
          :collision-padding="8"
          class="floating-panel z-40 flex items-center gap-2 p-3 outline-none sm:hidden"
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
      <XButton variant="ghost" size="sm">下一页</XButton>
    </PaginationNext>
  </PaginationRoot>
</template>
