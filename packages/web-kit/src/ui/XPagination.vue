<script setup lang="ts">
import {
  PaginationEllipsis,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from 'reka-ui';

import XButton from './XButton.vue';
import type { XPaginationProps } from './types';

defineProps<XPaginationProps>();

defineEmits<{
  change: [page: number];
}>();
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
            class="text-xs font-medium data-[selected]:bg-primary data-[selected]:text-white data-[selected]:hover:bg-primary-hover data-[selected]:hover:text-white"
          >
            {{ item.value }}
          </XButton>
        </PaginationListItem>
        <PaginationEllipsis
          v-else
          class="grid size-8 place-items-center text-xs text-muted"
        >
          …
        </PaginationEllipsis>
      </template>
    </PaginationList>

    <PaginationNext as-child>
      <XButton variant="outline" size="sm">下一页</XButton>
    </PaginationNext>
  </PaginationRoot>
</template>
