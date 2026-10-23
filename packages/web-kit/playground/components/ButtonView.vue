<script setup lang="ts">
import { AddOutlined } from '@vicons/material';
import {
  Toast,
  XButton,
  type XButtonColor,
  type XButtonSize,
  type XButtonVariant,
} from '@novelia/web-kit';

import ComponentPage from './ComponentPage.vue';

const colors: XButtonColor[] = ['primary', 'neutral', 'danger', 'warning'];
const variants: XButtonVariant[] = ['solid', 'soft', 'outline', 'ghost'];
const sizes: XButtonSize[] = ['md', 'sm', 'xs', 'tiny'];
const iconSizes: XButtonSize[] = ['icon', 'icon-sm', 'icon-xs'];
const code = `<XButton>主要操作</XButton>
<XButton color="neutral" variant="outline">取消</XButton>
<XButton color="danger" variant="soft">删除</XButton>
<XButton color="warning" variant="soft" size="tiny">紧凑按钮</XButton>
<XButton disabled>禁用</XButton>
<XButton loading>加载中</XButton>`;
</script>

<template>
  <ComponentPage
    title="按钮 · XButton"
    description="语义色与外观独立组合，支持紧凑尺寸、禁用和加载状态。"
    :code="code"
  >
    <section aria-labelledby="button-variants" class="min-w-0">
      <h2 id="button-variants" class="mb-2 font-medium">颜色与外观</h2>
      <p id="button-variants-hint" class="mb-4 text-sm leading-6 text-muted">
        按行对比语义色，按列对比外观。悬停或按下查看状态色，使用 Tab
        检查焦点；点击按钮可触发提示。窄屏可横向滚动查看。
      </p>
      <div
        role="region"
        aria-labelledby="button-variants"
        aria-describedby="button-variants-hint"
        tabindex="0"
        class="overflow-x-auto rounded-sm border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <table class="w-full min-w-[560px] border-collapse text-sm">
          <caption class="sr-only">XButton 语义色与外观组合</caption>
          <thead class="bg-embedded">
            <tr class="border-b border-divider">
              <th scope="col" class="px-4 py-3 text-left font-medium">
                语义色
              </th>
              <th
                v-for="variant in variants"
                :key="variant"
                scope="col"
                class="px-4 py-3 text-center font-medium"
              >
                <code class="text-xs text-muted">{{ variant }}</code>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="color in colors"
              :key="color"
              class="border-b border-divider last:border-b-0"
            >
              <th scope="row" class="px-4 py-4 text-left font-normal">
                <code class="text-xs text-muted">{{ color }}</code>
              </th>
              <td
                v-for="variant in variants"
                :key="variant"
                class="px-4 py-4 text-center"
              >
                <XButton
                  :color="color"
                  :variant="variant"
                  :aria-label="`${color} ${variant} 示例`"
                  @click="Toast.success(`点击了 ${color} ${variant} 按钮`)"
                >
                  操作按钮
                </XButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="button-sizes">
      <h2 id="button-sizes" class="mb-2 font-medium">尺寸</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        文字按钮由默认尺寸逐级收紧；纯图标按钮需提供可访问名称。
      </p>
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-sm border border-border bg-surface p-4">
          <h3 class="mb-4 text-sm font-medium">文字按钮</h3>
          <div class="flex flex-wrap items-end gap-6">
            <div
              v-for="size in sizes"
              :key="size"
              class="space-y-2 text-center"
            >
              <XButton :size="size">操作按钮</XButton>
              <code class="block text-xs text-muted">{{ size }}</code>
            </div>
          </div>
        </div>
        <div class="rounded-sm border border-border bg-surface p-4">
          <h3 class="mb-4 text-sm font-medium">图标按钮</h3>
          <div class="flex flex-wrap items-end gap-6">
            <div
              v-for="size in iconSizes"
              :key="size"
              class="space-y-2 text-center"
            >
              <XButton
                :size="size"
                variant="soft"
                :aria-label="`新增（${size}）`"
                @click="Toast.success(`点击了 ${size} 图标按钮`)"
              >
                <AddOutlined class="size-4" aria-hidden="true" />
              </XButton>
              <code class="block text-xs text-muted">{{ size }}</code>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section aria-labelledby="button-states">
      <h2 id="button-states" class="mb-2 font-medium">禁用与加载</h2>
      <p class="mb-4 text-sm leading-6 text-muted">
        两种状态均禁止点击；加载时保留按钮文字，并展示加载指示器。
      </p>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="color in colors"
          :key="color"
          class="rounded-sm border border-border bg-surface p-4"
        >
          <h3 class="mb-4 text-xs text-muted">
            <code>{{ color }}</code>
          </h3>
          <div class="flex flex-wrap items-center gap-3">
            <XButton
              :color="color"
              disabled
              @click="Toast.error('禁用按钮不应触发点击')"
            >
              禁用
            </XButton>
            <XButton
              :color="color"
              loading
              @click="Toast.error('加载按钮不应触发点击')"
            >
              加载中
            </XButton>
          </div>
        </div>
      </div>
    </section>
  </ComponentPage>
</template>
