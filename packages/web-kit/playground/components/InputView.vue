<script setup lang="ts">
import { SearchOutlined } from '@vicons/material';
import { XButton, XInput } from '@novelia/web-kit';
import { ref, useTemplateRef } from 'vue';
import ComponentPage from './ComponentPage.vue';

const value = ref('');
const password = ref('');
const input = useTemplateRef('input');
const clearCount = ref(0);
const code = `<XInput
  v-model="value"
  name="keyword"
  placeholder="搜索内容"
  aria-label="搜索内容"
  clearable
>
  <template #prefix><SearchOutlined class="size-4" /></template>
</XInput>`;
</script>

<template>
  <ComponentPage
    title="输入框 · XInput"
    description="轻量单行输入框：字符串绑定、清空、前后缀及原生表单属性透传。"
    :code="code"
  >
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">基本用法与前后缀</h2>
      <div class="max-w-md space-y-3">
        <label for="input-keyword" class="block text-sm">搜索内容</label>
        <XInput
          id="input-keyword"
          ref="input"
          v-model="value"
          name="keyword"
          placeholder="试试中文输入与清空"
          clearable
          @clear="clearCount++"
        >
          <template #prefix>
            <SearchOutlined class="size-4" aria-hidden="true" />
          </template>
          <template #suffix><span class="text-xs">关键词</span></template>
        </XInput>
        <p class="text-xs text-muted" aria-live="polite">
          当前值：{{ value || '（空）' }} · 清空次数：{{ clearCount }}
        </p>
        <XButton
          color="neutral"
          variant="outline"
          size="sm"
          @click="input?.focus()"
        >
          聚焦输入框
        </XButton>
        <label for="input-password" class="block text-sm">密码</label>
        <XInput
          id="input-password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          placeholder="输入密码"
        />
      </div>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">尺寸与状态</h2>
      <div class="grid max-w-2xl gap-3 sm:grid-cols-2">
        <XInput size="sm" placeholder="小尺寸 sm" aria-label="小尺寸" />
        <XInput size="md" placeholder="默认尺寸 md" aria-label="默认尺寸" />
        <XInput size="lg" placeholder="大尺寸 lg" aria-label="大尺寸" />
        <div>
          <XInput
            invalid
            model-value="不正确的内容"
            aria-label="错误示例"
            aria-describedby="input-error"
          />
          <p id="input-error" class="mt-1 text-xs text-error">请检查输入内容</p>
        </div>
        <XInput
          model-value="禁用内容"
          disabled
          clearable
          aria-label="禁用示例"
        />
        <XInput
          model-value="只读内容"
          readonly
          clearable
          aria-label="只读示例"
        />
      </div>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口约定</h2>
      <p class="text-sm leading-6 text-muted">
        v-model 默认为空字符串；type 支持
        text、password、email、search、tel、url。 clearable
        在非空且可编辑时显示清空按钮，清空后触发 clear 并恢复输入焦点。 prefix /
        suffix 插槽插入前后缀；class 和 style 作用于外层，ui 可覆盖 root、
        input、prefix、suffix、clear。id、name、placeholder、required、maxlength
        以及原生 input/change/focus/blur 事件等透传给 input。通过组件引用可访问
        input 元素并调用 focus、blur、select；请使用 label 或 aria-label
        提供名称。
      </p>
    </section>
  </ComponentPage>
</template>
