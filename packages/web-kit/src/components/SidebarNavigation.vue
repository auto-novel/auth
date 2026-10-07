<script setup lang="ts">
import { KeyboardArrowDownOutlined, OpenInNewOutlined } from '@vicons/material';
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
} from 'reka-ui';
import {
  isNavigationFailure,
  NavigationFailureType,
  RouterLink,
  useRouter,
} from 'vue-router';

import { externalLinkAttrs } from '../menu';
import type { WebKitMenuOption } from '../types';

withDefaults(
  defineProps<{
    options: WebKitMenuOption[];
    selected?: string;
    collapsed?: boolean;
    expanded: Set<string>;
    depth?: number;
  }>(),
  { depth: 0 },
);

const emit = defineEmits<{
  select: [samePath: boolean];
}>();

const router = useRouter();

async function navigate(event: MouseEvent, option: WebKitMenuOption) {
  if (
    (option.type && option.type !== 'link') ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  )
    return;

  event.preventDefault();
  const previousPath = router.currentRoute.value.path;
  try {
    const failure = await router.push(option.to);
    if (
      failure &&
      !isNavigationFailure(failure, NavigationFailureType.duplicated)
    )
      return;
    emit('select', previousPath === router.currentRoute.value.path);
  } catch {
    // 路由错误由宿主的 router.onError 处理，菜单保持原状。
  }
}
</script>

<template>
  <nav
    class="grid gap-1"
    :style="{ '--web-kit-item-indent': `${depth * 12}px` }"
    aria-label="站点导航"
  >
    <template v-for="option in options" :key="option.key">
      <div
        v-if="option.type === 'divider'"
        class="my-2 border-t border-divider"
        role="separator"
      />
      <CollapsibleRoot
        v-else-if="option.type === 'group'"
        :open="!collapsed && expanded.has(option.key)"
        @update:open="
          !collapsed &&
          ($event ? expanded.add(option.key) : expanded.delete(option.key))
        "
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
              <component v-if="option.icon" :is="option.icon" class="size-5" />
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
              :class="{ '-rotate-90': !expanded.has(option.key) }"
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent
          class="sidebar-submenu"
          :inert="collapsed || !expanded.has(option.key)"
        >
          <SidebarNavigation
            class="pt-1"
            :options="option.children"
            :depth="depth + 1"
            :expanded="expanded"
            :selected="selected"
            @select="emit('select', $event)"
          />
        </CollapsibleContent>
      </CollapsibleRoot>
      <a
        v-else-if="option.type === 'external'"
        v-bind="externalLinkAttrs(option)"
        class="web-kit-sidebar-item text-ink hover:bg-hover"
        :title="collapsed ? option.label : undefined"
      >
        <span
          class="grid size-5 flex-none place-items-center"
          aria-hidden="true"
        >
          <component v-if="option.icon" :is="option.icon" class="size-5" />
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
      <RouterLink v-else v-slot="{ href }" :to="option.to" custom>
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
          @click="navigate($event, option)"
        >
          <span
            class="grid size-5 flex-none place-items-center"
            aria-hidden="true"
          >
            <component v-if="option.icon" :is="option.icon" class="size-5" />
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

<style scoped>
.sidebar-submenu {
  overflow: hidden;
}

.sidebar-submenu[data-state='open'] {
  animation: submenu-expand 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-submenu[data-state='closed'] {
  animation: submenu-collapse 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes submenu-expand {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: var(--reka-collapsible-content-height);
    opacity: 1;
  }
}

@keyframes submenu-collapse {
  from {
    height: var(--reka-collapsible-content-height);
    opacity: 1;
  }
  to {
    height: 0;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-submenu[data-state] {
    animation: none;
  }
}
</style>
