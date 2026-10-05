<script setup lang="ts">
import { OpenInNewOutlined } from '@vicons/material';
import { RouterLink } from 'vue-router';

import type { WebKitMenuOption } from '../types';

defineProps<{
  options: WebKitMenuOption[];
  selected?: string;
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  select: [option: WebKitMenuOption];
}>();

async function navigate(
  event: MouseEvent,
  option: WebKitMenuOption,
  routerNavigate: (event?: MouseEvent) => Promise<unknown> | void,
) {
  const isPlainLeftClick =
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey;

  await routerNavigate(event);
  if (isPlainLeftClick) emit('select', option);
}
</script>

<template>
  <nav class="grid gap-1" aria-label="站点导航">
    <template v-for="option in options" :key="option.key">
      <div
        v-if="option.type === 'divider'"
        class="my-2 border-t border-divider"
        role="separator"
      />
      <a
        v-else-if="option.type === 'external'"
        :href="option.href"
        target="_blank"
        rel="noopener noreferrer"
        class="web-kit-sidebar-item text-ink hover:bg-hover"
        :aria-label="`${option.label}（在新标签页打开）`"
        :title="collapsed ? `${option.label}（在新标签页打开）` : undefined"
      >
        <span
          class="grid size-5 flex-none place-items-center"
          aria-hidden="true"
        >
          <component :is="option.icon" class="size-5" />
        </span>
        <span
          class="web-kit-sidebar-label inline-flex items-center gap-1"
          :class="collapsed ? 'opacity-0' : 'opacity-100'"
          :aria-hidden="collapsed"
        >
          <span class="truncate">{{ option.label }}</span>
          <OpenInNewOutlined class="size-3 flex-none" aria-hidden="true" />
        </span>
      </a>
      <RouterLink
        v-else
        v-slot="{ href, navigate: routerNavigate }"
        :to="option.to"
        custom
      >
        <a
          :href="href"
          class="web-kit-sidebar-item"
          :class="
            selected === option.key
              ? 'bg-primary-soft text-primary'
              : 'text-ink hover:bg-hover'
          "
          :aria-label="collapsed ? option.label : undefined"
          :title="collapsed ? option.label : undefined"
          :aria-current="selected === option.key ? 'page' : undefined"
          @click="navigate($event, option, routerNavigate)"
        >
          <span
            class="grid size-5 flex-none place-items-center"
            aria-hidden="true"
          >
            <component :is="option.icon" class="size-5" />
          </span>
          <span
            class="web-kit-sidebar-label"
            :class="collapsed ? 'opacity-0' : 'opacity-100'"
            :aria-hidden="collapsed"
          >
            {{ option.label }}
          </span>
        </a>
      </RouterLink>
    </template>
  </nav>
</template>
