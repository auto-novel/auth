<script setup lang="ts">
import { KeyboardArrowDownOutlined, OpenInNewOutlined } from '@vicons/material';
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
} from 'reka-ui';
import { ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import type { WebKitMenuOption } from '../types';

const props = defineProps<{
  options: WebKitMenuOption[];
  selected?: string;
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  select: [option: WebKitMenuOption];
}>();

const expanded = ref<Record<string, boolean>>({});

function containsSelected(options: WebKitMenuOption[]): boolean {
  return options.some((option) =>
    option.type === 'group'
      ? containsSelected(option.children)
      : option.type !== 'divider' && option.key === props.selected,
  );
}

watch(
  () => [props.options, props.selected],
  () => {
    for (const option of props.options) {
      if (option.type === 'group' && containsSelected(option.children)) {
        expanded.value[option.key] = true;
      }
    }
  },
  { immediate: true, deep: true },
);

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
      <CollapsibleRoot
        v-else-if="option.type === 'group'"
        v-model:open="expanded[option.key]"
      >
        <CollapsibleTrigger as-child>
          <button
            type="button"
            class="web-kit-sidebar-item text-ink hover:bg-hover"
            :aria-label="option.label"
            :title="collapsed ? option.label : undefined"
          >
            <span
              class="grid size-5 flex-none place-items-center"
              aria-hidden="true"
            >
              <component :is="option.icon" class="size-5" />
            </span>
            <span
              class="web-kit-sidebar-label flex-1"
              :class="collapsed ? 'opacity-0' : 'opacity-100'"
              :aria-hidden="collapsed"
            >
              {{ option.label }}
            </span>
            <KeyboardArrowDownOutlined
              v-if="!collapsed"
              class="size-4 flex-none transition-transform"
              :class="{ '-rotate-90': !expanded[option.key] }"
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarNavigation
            class="mt-1"
            :class="{ 'ml-3 border-l border-divider pl-1': !collapsed }"
            :options="option.children"
            :selected="selected"
            :collapsed="collapsed"
            @select="emit('select', $event)"
          />
        </CollapsibleContent>
      </CollapsibleRoot>
      <a
        v-else-if="option.type === 'external'"
        :href="option.href"
        :target="option.target ?? '_self'"
        :rel="option.target === '_blank' ? 'noopener noreferrer' : undefined"
        class="web-kit-sidebar-item text-ink hover:bg-hover"
        :aria-label="
          option.target === '_blank'
            ? `${option.label}（在新标签页打开）`
            : option.label
        "
        :title="collapsed ? option.label : undefined"
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
          <OpenInNewOutlined
            v-if="option.target === '_blank'"
            class="size-3 flex-none"
            aria-hidden="true"
          />
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
