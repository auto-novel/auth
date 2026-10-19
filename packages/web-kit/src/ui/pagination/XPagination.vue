<script lang="ts">
const INTERACTIVE_SELECTOR =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"], [role="tablist"], [role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"]';
const MODAL_SELECTOR =
  'dialog[open], [role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [aria-modal="true"]:not([hidden]):not([data-state="closed"])';

function isElement(node: unknown): node is Element {
  return typeof Element !== 'undefined' && node instanceof Element;
}
</script>

<script setup lang="ts">
import {
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from 'reka-ui';
import { onKeyDown } from '@vueuse/core';
import { onActivated, onDeactivated, onMounted, ref, watch } from 'vue';

import XButton from '../button/XButton.vue';
import { mergeClasses } from '../classes';
import PageJump from './PageJump.vue';
import type { XPaginationProps } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<XPaginationProps>(), { ui: () => ({}) });

const emit = defineEmits<{
  'update:page': [page: number];
}>();

const openJumpIndex = ref<number | null>(null);
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
    if (
      event
        .composedPath()
        .some(
          (node) =>
            isElement(node) &&
            (node.closest(INTERACTIVE_SELECTOR) ||
              (node as HTMLElement).isContentEditable),
        ) ||
      document?.querySelector(MODAL_SELECTOR)
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
    emit('update:page', nextPage);
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
  if (open) openJumpIndex.value = index;
  else if (openJumpIndex.value === index) openJumpIndex.value = null;
}

watch([() => props.page, () => props.totalPages], () => {
  openJumpIndex.value = null;
});
</script>

<template>
  <PaginationRoot
    aria-label="分页"
    v-bind="{ ...$attrs, class: undefined }"
    :page="page"
    :total="totalPages"
    :items-per-page="1"
    :sibling-count="1"
    show-edges
    :class="
      mergeClasses(
        'flex items-center justify-between border-t border-divider px-4 py-3 text-sm sm:px-6',
        ui.root,
        $attrs.class,
      )
    "
    @update:page="$emit('update:page', $event)"
  >
    <PaginationPrev as-child>
      <XButton variant="ghost" size="sm" :class="mergeClasses(ui.prev)">
        上一页
      </XButton>
    </PaginationPrev>

    <PageJump
      :open="openJumpIndex === -1"
      :page="page"
      :total-pages="totalPages"
      :ui="{
        content: mergeClasses('sm:hidden', ui.jumpContent),
        label: ui.jumpLabel,
        input: ui.jumpInput,
        button: ui.jumpButton,
      }"
      @update:open="setJumpOpen($event, -1)"
      @change="$emit('update:page', $event)"
    >
      <XButton
        variant="ghost"
        size="sm"
        :class="mergeClasses('text-xs text-muted sm:hidden', ui.summary)"
        :disabled="totalPages < 1"
        :aria-label="`当前第 ${page} 页，共 ${totalPages} 页，跳转到指定页`"
        title="跳转到指定页"
      >
        {{ page }} / {{ totalPages }}
      </XButton>
    </PageJump>
    <PaginationList
      v-slot="{ items }"
      :class="mergeClasses('hidden items-center gap-1 sm:flex', ui.list)"
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
            :class="
              mergeClasses(
                'text-xs font-medium data-selected:bg-primary data-selected:text-on-primary data-selected:hover:bg-primary-hover data-selected:hover:text-on-primary',
                ui.item,
              )
            "
          >
            {{ item.value }}
          </XButton>
        </PaginationListItem>
        <PageJump
          v-else
          :open="openJumpIndex === index"
          :page="page"
          :total-pages="totalPages"
          :ui="{
            content: ui.jumpContent,
            label: ui.jumpLabel,
            input: ui.jumpInput,
            button: ui.jumpButton,
          }"
          @update:open="setJumpOpen($event, index)"
          @change="$emit('update:page', $event)"
        >
          <XButton
            variant="ghost"
            size="icon-sm"
            :class="mergeClasses('text-xs text-muted', ui.ellipsis)"
            aria-label="跳转到指定页"
            title="跳转到指定页"
          >
            …
          </XButton>
        </PageJump>
      </template>
    </PaginationList>

    <PaginationNext as-child>
      <XButton variant="ghost" size="sm" :class="mergeClasses(ui.next)">
        下一页
      </XButton>
    </PaginationNext>
  </PaginationRoot>
</template>
