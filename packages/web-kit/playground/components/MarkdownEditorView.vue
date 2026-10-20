<script setup lang="ts">
import { XButton, XMarkdownEditor, createMarkdown } from '@novelia/web-kit';
import { ref, useTemplateRef } from 'vue';
import ComponentPage from './ComponentPage.vue';

// 实际项目在模块级创建一次并共享；playground 只有一个视图实例。
const markdown = createMarkdown().disable(['image']);
const source = ref(
  '## 共享 Markdown\n\n选中文字后点击格式按钮，也可以粘贴一个网址。\n\n!!点击查看剧透!!\n\n::: details 点击展开\n折叠内容\n:::\n\n::: star 4.5',
);
const editor = useTemplateRef('editor');
const sticky = ref(false);
const code = `// 模块级创建一次并共享
const markdown = createMarkdown().disable(['image']);
// markdown.use(...) 可继续挂载子网站插件

<XMarkdownEditor
  v-model="source"
  :markdown="markdown"
  :tools="['bold', 'italic', 'strike', 'code', 'link', 'spoiler', 'star', 'details']"
  aria-label="正文"
  sticky
  :sticky-offset="50"
/>`;
</script>

<template>
  <ComponentPage
    title="Markdown 编辑器 · XMarkdownEditor"
    description="内置安全预览，支持自定义解析器与工具栏扩展。"
    :code="code"
  >
    <section class="space-y-3 border-t border-divider pt-6">
      <h2 class="font-medium">选区编辑、预览和工具栏扩展</h2>
      <p class="text-sm text-muted">
        预览使用调用方传入的解析器，净化仍由共享组件完成，支持剧透、半星评分和折叠内容。选中文字后粘贴
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
        :markdown="markdown"
        name="content"
        :rows="5"
        :maxlength="2000"
        :tools="[
          'bold',
          'italic',
          'strike',
          'code',
          'link',
          'spoiler',
          'star',
          'details',
        ]"
        :sticky="sticky"
        :sticky-offset="50"
        aria-describedby="markdown-hint"
      />
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
            :preview="false"
            :rows="3"
            :tools="[]"
            aria-label="错误示例"
            aria-describedby="markdown-error"
          />
          <p id="markdown-error" class="mt-1 text-xs text-error">
            示例校验错误；preview=false 时只显示编辑标签。
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
        按钮，默认启用 bold、italic、strike、code、link；spoiler、star、details
        按需加入 tools。toolbar 插槽提供
        disabled、wrapSelection、insertBlock；插入方法返回
        Promise&lt;boolean&gt;。预览默认开启，设置 preview=false
        可隐藏，空内容显示统一提示。解析器由调用方通过 createMarkdown
        创建（可继续 use 子网站插件），以 markdown
        属性传入；不传时使用共享默认实例。组件始终负责净化，不内置业务模式。排版与扩展配色可通过
        --markdown-* CSS 变量覆盖。class/style
        用于外层；其余原生属性与事件透传到 textarea。ui 可覆盖
        root、toolbar、tabs、tab、tools、tool、textarea、preview。组件引用提供
        textarea、focus、blur
        和两种插入方法。支持的浏览器优先使用原生编辑命令保留撤销；格式按钮在不支持时退回选区替换，粘贴转换则退回原生粘贴。
      </p>
    </section>
  </ComponentPage>
</template>
