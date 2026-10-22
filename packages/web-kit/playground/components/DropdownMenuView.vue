<script setup lang="ts">
import {
  XButton,
  XDropdownMenu,
  XDropdownMenuItem,
  XDropdownMenuSeparator,
  XSelect,
  type XDropdownMenuProps,
} from '@novelia/web-kit';
import { ref } from 'vue';

import ComponentPage from './ComponentPage.vue';

const open = ref(false);
const selected = ref('尚未执行操作');
const keepOpenCount = ref(0);
const side = ref<NonNullable<XDropdownMenuProps['side']>>('bottom');
const align = ref<NonNullable<XDropdownMenuProps['align']>>('end');
const sideOptions = [
  { label: '下方 · bottom', value: 'bottom' },
  { label: '上方 · top', value: 'top' },
  { label: '左侧 · left', value: 'left' },
  { label: '右侧 · right', value: 'right' },
];
const alignOptions = [
  { label: '起点 · start', value: 'start' },
  { label: '居中 · center', value: 'center' },
  { label: '终点 · end', value: 'end' },
];

function setSide(value: string) {
  if (
    value === 'top' ||
    value === 'right' ||
    value === 'bottom' ||
    value === 'left'
  ) {
    side.value = value;
  }
}

function setAlign(value: string) {
  if (value === 'start' || value === 'center' || value === 'end') {
    align.value = value;
  }
}

function keepOpen() {
  keepOpenCount.value += 1;
  selected.value = `已标记 ${keepOpenCount.value} 次，菜单保持打开`;
}

const code = `const open = ref(false);

<XButton @click="open = true">外部打开</XButton>
<XButton @click="open = false">外部关闭</XButton>
<XDropdownMenu
  v-model:open="open"
  side="bottom"
  align="end"
  :modal="false"
>
  <template #trigger="{ open: isOpen }">
    <XButton color="neutral" variant="outline">
      {{ isOpen ? '收起操作' : '打开操作' }}
    </XButton>
  </template>
  <XDropdownMenuItem @select="edit">编辑</XDropdownMenuItem>
  <XDropdownMenuItem disabled>暂无权限</XDropdownMenuItem>
  <XDropdownMenuItem @select.prevent="mark">标记并保持打开</XDropdownMenuItem>
  <XDropdownMenuSeparator />
  <XDropdownMenuItem destructive @select="remove">删除</XDropdownMenuItem>
</XDropdownMenu>`;
</script>

<template>
  <ComponentPage
    title="下拉菜单 · XDropdownMenu"
    description="通过自定义触发器打开操作菜单，支持受控开关、定位、禁用项及键盘焦点管理。"
    :code="code"
  >
    <section class="min-w-0">
      <h2 class="mb-2 font-medium">受控开关与自定义触发器</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        外部按钮通过 v-model:open 控制菜单。此例设置
        modal=false，菜单打开时仍能操作页面上的关闭按钮。
        普通选项选中后关闭，“标记”使用 @select.prevent 保持打开。
      </p>
      <div class="mb-5 grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="flex min-w-0 flex-col gap-2 text-sm text-muted">
          弹出方向 · side
          <XSelect
            :model-value="side"
            :options="sideOptions"
            aria-label="菜单弹出方向"
            @update:model-value="setSide"
          />
        </label>
        <label class="flex min-w-0 flex-col gap-2 text-sm text-muted">
          对齐方式 · align
          <XSelect
            :model-value="align"
            :options="alignOptions"
            aria-label="菜单对齐方式"
            @update:model-value="setAlign"
          />
        </label>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <XButton color="neutral" variant="outline" @click="open = true">
          外部打开
        </XButton>
        <XButton color="neutral" variant="outline" @click="open = false">
          外部关闭
        </XButton>
        <XDropdownMenu
          v-model:open="open"
          :side="side"
          :align="align"
          :modal="false"
          :ui="{ content: 'max-w-[calc(100vw-1rem)]' }"
          aria-label="项目操作"
        >
          <template #trigger="{ open: isOpen }">
            <XButton color="neutral" variant="outline">
              {{ isOpen ? '收起操作' : '打开操作' }}
              <span aria-hidden="true">▾</span>
            </XButton>
          </template>
          <XDropdownMenuItem @select="selected = '已选择编辑'">
            编辑项目
          </XDropdownMenuItem>
          <XDropdownMenuItem disabled>复制链接（暂无权限）</XDropdownMenuItem>
          <XDropdownMenuItem @select.prevent="keepOpen">
            标记并保持打开 · {{ keepOpenCount }}
          </XDropdownMenuItem>
          <XDropdownMenuSeparator />
          <XDropdownMenuItem
            destructive
            @select="selected = '已选择删除（仅演示，不删除数据）'"
          >
            删除项目
          </XDropdownMenuItem>
        </XDropdownMenu>
      </div>
      <div class="mt-4 space-y-1 text-sm leading-6 text-muted" role="status">
        <p>
          菜单状态：{{ open ? '已打开' : '已关闭' }} · {{ side }} / {{ align }}
        </p>
        <p class="break-words">{{ selected }}</p>
      </div>
      <p class="mt-3 text-xs leading-5 text-muted">
        菜单会自动避让视口边缘，实际方向可能与所选 side
        不同。删除项仅更新演示状态。
      </p>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-2 font-medium">禁用触发器</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        disabled
        作用于触发器，无法通过点击或键盘打开；它不会强制关闭一个已经打开的菜单。
      </p>
      <XDropdownMenu disabled>
        <template #trigger>
          <XButton color="neutral" variant="outline" disabled>
            操作不可用
          </XButton>
        </template>
        <XDropdownMenuItem>不可触发的菜单项</XDropdownMenuItem>
      </XDropdownMenu>
    </section>

    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">API 与键盘</h2>
      <ul class="space-y-2 text-sm leading-6 text-muted">
        <li>
          XDropdownMenu：v-model:open 控制开关，省略时内部管理；side 为 top /
          right / bottom / left （默认 bottom），align 为 start / center /
          end（默认 end），side-offset 默认 6。
        </li>
        <li>
          modal 默认为 true；disabled 仅禁用触发器。#trigger 接收
          open，应提供一个可聚焦的按钮作为唯一根节点。 class、aria-* 和
          ui.content 作用于 Portal 中的菜单内容，触发器属性应直接放在按钮上。
        </li>
        <li>
          XDropdownMenuItem：disabled 禁用选中；destructive 仅提供危险操作样式。
          @select 接收原生 Event，使用 @select.prevent
          阻止选中后关闭。XDropdownMenuSeparator 用于分组。
        </li>
        <li>
          聚焦触发器后用 Enter / 空格 / ↓ 打开；菜单内 ↑ / ↓ 移动，Home / End
          跳至首尾， Enter / 空格选择，输入字符快速定位。禁用项被跳过；Esc
          关闭并返回触发器，Tab 不是菜单内导航方式。
        </li>
      </ul>
    </section>
  </ComponentPage>
</template>
