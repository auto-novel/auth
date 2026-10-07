<script setup lang="ts">
import { ChevronRightOutlined, OpenInNewOutlined } from '@vicons/material';
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'reka-ui';
import { RouterLink } from 'vue-router';

import { externalLinkAttrs } from '../menu';
import type { WebKitMenuOption } from '../types';

defineProps<{ options: WebKitMenuOption[] }>();
</script>

<template>
  <template v-for="option in options" :key="option.key">
    <DropdownMenuSeparator
      v-if="option.type === 'divider'"
      class="my-1 border-t border-divider"
    />
    <DropdownMenuSub v-else-if="option.type === 'group'">
      <DropdownMenuSubTrigger class="account-menu-item">
        <component
          :is="option.icon"
          class="size-4 flex-none"
          aria-hidden="true"
        />
        <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
        <ChevronRightOutlined class="size-4 flex-none" aria-hidden="true" />
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent
          :side-offset="4"
          :collision-padding="8"
          class="account-menu z-40 p-1 outline-none"
        >
          <AccountMenuOptions :options="option.children" />
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
    <DropdownMenuItem v-else-if="option.type === 'external'" as-child>
      <a v-bind="externalLinkAttrs(option)" class="account-menu-item">
        <component
          :is="option.icon"
          class="size-4 flex-none"
          aria-hidden="true"
        />
        <span class="min-w-0 truncate">{{ option.label }}</span>
        <OpenInNewOutlined
          v-if="option.target === '_blank'"
          class="size-3 flex-none"
          aria-hidden="true"
        />
      </a>
    </DropdownMenuItem>
    <DropdownMenuItem v-else as-child>
      <RouterLink :to="option.to" class="account-menu-item">
        <component :is="option.icon" class="size-4" aria-hidden="true" />
        {{ option.label }}
      </RouterLink>
    </DropdownMenuItem>
  </template>
</template>
