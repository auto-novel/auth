<script setup lang="ts">
import { CheckOutlined, KeyboardArrowDownOutlined } from '@vicons/material';
import { computed } from 'vue';

import XDropdownMenu from '../../ui/dropdown-menu/XDropdownMenu.vue';
import XDropdownMenuItem from '../../ui/dropdown-menu/XDropdownMenuItem.vue';

const props = defineProps<{
  current: 'auth' | 'forum' | 'auto-novel';
}>();

const sites = [
  { key: 'auth', label: 'Auth', href: 'https://auth.novelia.cc/admin/' },
  { key: 'forum', label: 'Forum', href: 'https://forum.novelia.cc/admin/' },
  { key: 'auto-novel', label: 'AutoNovel', href: 'https://n.novelia.cc/admin/' },
] as const;

const currentLabel = computed(
  () => sites.find((site) => site.key === props.current)!.label,
);
</script>

<template>
  <XDropdownMenu aria-label="管理后台切换">
    <template #trigger>
      <button
        type="button"
        class="group flex min-h-9 items-center gap-1 rounded-sm px-3 text-sm text-ink transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-label="`切换管理后台，当前 ${currentLabel}`"
      >
        <span>{{ currentLabel }}</span>
        <KeyboardArrowDownOutlined
          class="size-4 flex-none transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </button>
    </template>
    <XDropdownMenuItem
      v-for="site in sites"
      :key="site.key"
      as-child
      :disabled="site.key === props.current"
    >
      <a
        :href="site.href"
        :aria-current="site.key === props.current ? 'page' : undefined"
      >
        <span class="min-w-0 flex-1">{{ site.label }}</span>
        <CheckOutlined
          v-if="site.key === props.current"
          class="size-4 flex-none"
          aria-hidden="true"
        />
      </a>
    </XDropdownMenuItem>
  </XDropdownMenu>
</template>
