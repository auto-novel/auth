<script setup lang="ts">
import { UnfoldMoreOutlined, VisibilityOffOutlined } from '@vicons/material';
import {
  XButton,
  XMarkdownEditor,
  XMarkdownEditorToolButton,
} from '@novelia/web-kit';
import { ref, useTemplateRef } from 'vue';
import ComponentPage from './ComponentPage.vue';

const source = ref(
  '选中文字后点击格式按钮，也可以粘贴一个网址。\n\n试试预览和工具栏扩展。',
);
const editor = useTemplateRef('editor');
const sticky = ref(false);
const code = `<XMarkdownEditor v-model="source" aria-label="正文" sticky :sticky-offset="50">
  <template #preview="{ source }">
    <!-- 在这里接入项目自己的 Markdown 渲染组件；不要直接 v-html 原始输入。 -->
    <pre class="whitespace-pre-wrap">{{ source }}</pre>
  </template>
  <template #toolbar="{ insertBlock, disabled }">
    <XMarkdownEditorToolButton label="折叠内容" :disabled="disabled"
      @click="insertBlock('::: details 点击展开\\n', '\\n:::', '折叠内容')">
      <UnfoldMoreOutlined class="size-4" aria-hidden="true" />
    </XMarkdownEditorToolButton>
  </template>
</XMarkdownEditor>`;
</script>

<template>
  <ComponentPage
    title="Markdown 编辑器 · XMarkdownEditor"
    description="只负责编辑交互，通过插槽接入渲染与自定义语法，不依赖论坛或 Markdown 解析器。"
    :code="code"
  >
    <section class="space-y-3 border-t border-divider pt-6">
      <h2 class="font-medium">选区编辑、预览和工具栏扩展</h2>
      <p class="text-sm text-muted">
        预览区在本示例中仅以纯文本展示源码；实际项目可替换为自己的安全渲染组件。选中文字后粘贴
        HTTP(S) 地址可转换成链接。
      </p>
      <div class="flex flex-wrap items-center gap-4">
        <XButton variant="outline" size="sm" @click="editor?.focus()">
          聚焦编辑器
        </XButton>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="sticky" type="checkbox" />
          工具栏吸顶（50px 偏移）
        </label>
      </div>
      <label for="markdown-source" class="block text-sm font-medium">
        正文
      </label>
      <XMarkdownEditor
        id="markdown-source"
        ref="editor"
        v-model="source"
        name="content"
        :rows="5"
        :maxlength="2000"
        :sticky="sticky"
        :sticky-offset="50"
        aria-describedby="markdown-hint"
      >
        <template #preview="{ source: text }">
          <pre class="whitespace-pre-wrap text-sm">{{
            text || '没有可预览的内容'
          }}</pre>
        </template>
        <template #toolbar="{ insertBlock, wrapSelection, disabled }">
          <XMarkdownEditorToolButton
            label="剧透"
            :disabled="disabled"
            @click="wrapSelection('!!', '!!', '剧透内容')"
          >
            <VisibilityOffOutlined class="size-4" aria-hidden="true" />
          </XMarkdownEditorToolButton>
          <XMarkdownEditorToolButton
            label="折叠内容"
            :disabled="disabled"
            @click="insertBlock('::: details 点击展开\n', '\n:::', '折叠内容')"
          >
            <UnfoldMoreOutlined class="size-4" aria-hidden="true" />
          </XMarkdownEditorToolButton>
        </template>
      </XMarkdownEditor>
      <p id="markdown-hint" class="text-xs text-muted">
        {{ source.length }} / 2000；按钮插入同样遵守
        maxlength，中文组合输入时禁用格式操作。
      </p>
    </section>
    <section class="space-y-3 border-t border-divider pt-6">
      <h2 class="font-medium">禁用、只读和固定高度</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <XMarkdownEditor
          model-value="禁用期间不能编辑或插入格式。"
          disabled
          :rows="3"
          aria-label="禁用示例"
        />
        <XMarkdownEditor
          model-value="只读内容仍可选择和复制。"
          readonly
          :rows="3"
          aria-label="只读示例"
        />
        <XMarkdownEditor
          :autosize="false"
          :rows="3"
          :tools="['bold', 'link']"
          aria-label="手动调整高度"
          placeholder="关闭 autosize 后可手动调整高度"
        />
        <div>
          <XMarkdownEditor
            invalid
            :rows="3"
            :tools="[]"
            aria-label="错误示例"
            aria-describedby="markdown-error"
          />
          <p id="markdown-error" class="mt-1 text-xs text-error">
            示例校验错误；未配置 preview 插槽时只显示编辑标签。
          </p>
        </div>
      </div>
    </section>
    <section class="border-t border-divider pt-6">
      <h2 class="mb-3 font-medium">接口约定</h2>
      <p class="text-sm leading-6 text-muted">
        v-model 绑定字符串。autosize 默认开启，rows 为最小高度；sticky
        默认关闭，stickyOffset 单位为
        px，取决于外部滚动容器，吸顶后工具栏显示轻阴影。tools 选择内置
        bold、italic、strike、code、link 按钮。toolbar 插槽提供
        disabled、wrapSelection、insertBlock；插入方法返回
        Promise&lt;boolean&gt;。只有提供 preview 插槽时才显示预览标签，插槽接收
        source，由调用方负责解析和净化 HTML。class/style
        用于外层；其余原生属性与事件透传到 textarea。ui 可覆盖
        root、toolbar、tabs、tab、tools、tool、textarea、preview。组件引用提供
        textarea、focus、blur
        和两种插入方法。支持的浏览器优先使用原生编辑命令保留撤销；格式按钮在不支持时退回选区替换，粘贴转换则退回原生粘贴。
      </p>
    </section>
  </ComponentPage>
</template>
