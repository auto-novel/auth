<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
  type Component,
  type TextareaHTMLAttributes,
} from 'vue';

import {
  LinkOutlined,
  StarBorderOutlined,
  UnfoldMoreOutlined,
  VisibilityOffOutlined,
} from '@vicons/material';

import XMarkdownContent from './XMarkdownContent.vue';
import XMarkdownEditorToolButton from './XMarkdownEditorToolButton.vue';
import { mergeClasses } from '../classes';
import XTabs from '../tabs/XTabs.vue';
import XTabsList from '../tabs/XTabsList.vue';
import XTabsTrigger from '../tabs/XTabsTrigger.vue';
import XTabsContent from '../tabs/XTabsContent.vue';
import { handleMarkdownLinkPaste, insertMarkdownText } from './editing';
import type {
  XMarkdownEditorActions,
  XMarkdownEditorProps,
  XMarkdownEditorTool,
} from './types';

// 布局属性作用于外层，其余原生属性和监听器透传给 textarea。
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<XMarkdownEditorProps>(), {
  placeholder: '使用 Markdown 输入内容…',
  rows: 7,
  autosize: true,
  preview: true,
  stickyOffset: 0,
  tools: () => ['bold', 'italic', 'strike', 'code', 'link'],
  ui: () => ({}),
});
const model = defineModel<string>({ default: '' });
defineSlots<{
  toolbar?: (props: XMarkdownEditorActions & { disabled: boolean }) => unknown;
}>();
const activeTab = ref('edit');
const tabClass =
  'border-r border-border border-b-transparent text-[0.8125rem] font-semibold data-[state=active]:text-ink';
const textarea = useTemplateRef<HTMLTextAreaElement>('textarea');
const root = useTemplateRef<HTMLElement>('root');
const sentinel = useTemplateRef<HTMLElement>('sentinel');
const composing = ref(false);
const stuck = ref(false);
const blocked = computed(
  () => props.disabled || props.readonly || composing.value,
);
const stickyOffsetPx = computed(() =>
  Number.isFinite(props.stickyOffset) ? Math.max(0, props.stickyOffset) : 0,
);
const toolbarStyle = computed(() =>
  props.sticky ? { top: `${stickyOffsetPx.value}px` } : undefined,
);
let widthObserver: ResizeObserver | undefined;
let stuckObserver: IntersectionObserver | undefined;

function resize() {
  const element = textarea.value;
  if (!element) return;
  if (!props.autosize) {
    element.style.height = '';
    return;
  }
  if (activeTab.value !== 'edit') return;
  const view = element.ownerDocument.defaultView;
  const scrollY = view?.scrollY;
  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
  if (view && scrollY !== undefined && view.scrollY !== scrollY) {
    view.scrollTo({ top: scrollY, behavior: 'instant' });
  }
}

// 吸顶状态只在挂载以及 sticky/stickyOffset 变化时重新解析滚动容器。
function findScrollParent(element: HTMLElement): HTMLElement | null {
  const view = element.ownerDocument.defaultView;
  if (!view?.getComputedStyle) return null;
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    if (
      /(auto|scroll|overlay|hidden)/.test(view.getComputedStyle(node).overflowY)
    )
      return node;
  }
  return null;
}

function observeStuck() {
  stuckObserver?.disconnect();
  stuck.value = false;
  if (!props.sticky || typeof IntersectionObserver === 'undefined') return;
  const sentinelElement = sentinel.value;
  const rootElement = root.value;
  if (!sentinelElement || !rootElement) return;
  stuckObserver = new IntersectionObserver(
    ([entry]) => {
      stuck.value =
        !!entry &&
        !entry.isIntersecting &&
        entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0);
    },
    {
      root: findScrollParent(rootElement),
      rootMargin: `-${stickyOffsetPx.value}px 0px 0px 0px`,
    },
  );
  stuckObserver.observe(sentinelElement);
}

onMounted(() => {
  resize();
  observeStuck();
  if (typeof ResizeObserver !== 'undefined' && root.value) {
    let width = -1;
    widthObserver = new ResizeObserver(([entry]) => {
      if (!entry || entry.contentRect.width === width) return;
      width = entry.contentRect.width;
      resize();
    });
    widthObserver.observe(root.value);
  }
});
onBeforeUnmount(() => {
  widthObserver?.disconnect();
  stuckObserver?.disconnect();
});
watch([model, activeTab, () => props.rows, () => props.autosize], resize, {
  flush: 'post',
});
watch([() => props.sticky, stickyOffsetPx], observeStuck, { flush: 'post' });
watch(
  () => props.preview,
  (enabled) => {
    if (!enabled) activeTab.value = 'edit';
  },
);

async function focus(options?: FocusOptions) {
  activeTab.value = 'edit';
  await nextTick();
  textarea.value?.focus(options);
}

async function applySelection(
  prefix: string,
  suffix: string,
  placeholder: string,
  block: boolean,
) {
  if (blocked.value) return false;
  await focus({ preventScroll: true });
  const element = textarea.value;
  if (!element || blocked.value) return false;
  const { selectionStart: start, selectionEnd: end, value } = element;
  const selected = value.slice(start, end) || placeholder;
  const before = value.slice(0, start);
  const after = value.slice(end);
  const leading = block && before && !before.endsWith('\n') ? '\n' : '';
  const trailing = block && after && !after.startsWith('\n') ? '\n' : '';
  const insertion = `${leading}${prefix}${selected}${suffix}${trailing}`;
  if (!insertMarkdownText(element, insertion)) return false;
  await nextTick();
  const selectionStart = start + leading.length + prefix.length;
  element.setSelectionRange(selectionStart, selectionStart + selected.length);
  resize();
  return true;
}
const wrapSelection: XMarkdownEditorActions['wrapSelection'] = (
  prefix,
  suffix,
  placeholder = '',
) => applySelection(prefix, suffix, placeholder, false);
const insertBlock: XMarkdownEditorActions['insertBlock'] = (
  prefix,
  suffix = '',
  placeholder = '',
) => applySelection(prefix, suffix, placeholder, true);

interface ToolDefinition {
  label: string;
  prefix: string;
  suffix: string;
  placeholder: string;
  text?: string;
  icon?: Component;
  block?: boolean;
}

const toolDefinitions: Record<XMarkdownEditorTool, ToolDefinition> = {
  bold: {
    label: '粗体',
    text: 'B',
    prefix: '**',
    suffix: '**',
    placeholder: '粗体',
  },
  italic: {
    label: '斜体',
    text: 'I',
    prefix: '*',
    suffix: '*',
    placeholder: '斜体',
  },
  strike: {
    label: '删除线',
    text: 'S',
    prefix: '~~',
    suffix: '~~',
    placeholder: '删除线',
  },
  code: {
    label: '行内代码',
    text: '<>',
    prefix: '`',
    suffix: '`',
    placeholder: '行内代码',
  },
  link: {
    label: '链接',
    icon: LinkOutlined,
    prefix: '[',
    suffix: '](https://)',
    placeholder: '链接文字',
  },
  spoiler: {
    label: '剧透',
    icon: VisibilityOffOutlined,
    prefix: '!!',
    suffix: '!!',
    placeholder: '剧透内容',
  },
  star: {
    label: '评分',
    icon: StarBorderOutlined,
    prefix: '::: star 5',
    suffix: '',
    placeholder: '',
    block: true,
  },
  details: {
    label: '折叠内容',
    icon: UnfoldMoreOutlined,
    prefix: '::: details 点击展开\n',
    suffix: '\n:::',
    placeholder: '折叠内容',
    block: true,
  },
};

function insertTool(tool: XMarkdownEditorTool) {
  const { prefix, suffix, placeholder, block } = toolDefinitions[tool];
  return block
    ? insertBlock(prefix, suffix, placeholder)
    : wrapSelection(prefix, suffix, placeholder);
}

function paste(event: ClipboardEvent) {
  if (!blocked.value) handleMarkdownLinkPaste(event, textarea.value);
}

defineExpose({
  textarea,
  focus,
  blur: () => textarea.value?.blur(),
  wrapSelection,
  insertBlock,
});
</script>

<template>
  <div
    ref="root"
    :style="$attrs.style"
    :class="
      mergeClasses(
        'min-w-0 rounded-sm border bg-transparent text-ink',
        sticky && 'relative',
        invalid ? 'border-error' : 'border-border',
        ui.root,
        $attrs.class,
      )
    "
  >
    <span
      v-if="sticky"
      ref="sentinel"
      class="pointer-events-none absolute inset-x-0 top-0 h-px"
      aria-hidden="true"
    />
    <XTabs v-model="activeTab" class="gap-0 rounded-[inherit]">
      <div
        :data-stuck="stuck || undefined"
        :style="toolbarStyle"
        :class="
          mergeClasses(
            'flex flex-wrap items-stretch rounded-t-[inherit] border-b border-border bg-body',
            sticky && 'sticky z-20',
            stuck && 'shadow-[0_4px_10px_-6px_rgb(0_0_0_/_0.3)]',
            ui.toolbar,
          )
        "
      >
        <XTabsList
          aria-label="Markdown 编辑模式"
          :class="
            mergeClasses(
              'gap-0 border-0 data-[orientation=horizontal]:border-b-0 [&>[data-slot=tabs-indicator]]:bg-ink',
              ui.tabs,
            )
          "
        >
          <XTabsTrigger value="edit" :class="mergeClasses(tabClass, ui.tab)">
            编辑
          </XTabsTrigger>
          <XTabsTrigger
            v-if="preview"
            value="preview"
            :class="mergeClasses(tabClass, ui.tab)"
          >
            预览
          </XTabsTrigger>
        </XTabsList>
        <div
          v-if="tools.length || $slots.toolbar"
          role="group"
          aria-label="Markdown 格式工具"
          :inert="activeTab !== 'edit'"
          :aria-hidden="activeTab !== 'edit' || undefined"
          :class="
            mergeClasses(
              'order-last flex w-full flex-wrap items-center gap-0.5 border-t border-border p-1 sm:order-none sm:ml-auto sm:w-auto sm:border-t-0',
              activeTab !== 'edit' && 'invisible',
              ui.tools,
            )
          "
        >
          <XMarkdownEditorToolButton
            v-for="tool in tools"
            :key="tool"
            :disabled="blocked"
            :label="toolDefinitions[tool].label"
            :class="
              mergeClasses(
                {
                  'font-bold': tool === 'bold',
                  italic: tool === 'italic',
                  'line-through': tool === 'strike',
                },
                ui.tool,
              )
            "
            @click="insertTool(tool)"
          >
            <component
              :is="toolDefinitions[tool].icon"
              v-if="toolDefinitions[tool].icon"
              class="size-4"
              aria-hidden="true"
            />
            <template v-else>{{ toolDefinitions[tool].text }}</template>
          </XMarkdownEditorToolButton>
          <span
            v-if="tools.length && $slots.toolbar"
            class="mx-1 h-4 w-px shrink-0 bg-border"
            aria-hidden="true"
          />
          <slot
            name="toolbar"
            :disabled="blocked"
            :wrap-selection="wrapSelection"
            :insert-block="insertBlock"
          />
        </div>
      </div>
      <XTabsContent value="edit" force-mount>
        <textarea
          ref="textarea"
          v-model="model"
          v-bind="{ ...$attrs, class: undefined, style: undefined }"
          :rows="rows"
          :maxlength="maxlength"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :aria-invalid="
            invalid
              ? true
              : ($attrs[
                  'aria-invalid'
                ] as TextareaHTMLAttributes['aria-invalid'])
          "
          :class="
            mergeClasses(
              'block w-full border-0 bg-transparent px-3 py-3 text-sm leading-6 text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50',
              autosize ? 'resize-none overflow-hidden' : 'resize-y',
              ui.textarea,
            )
          "
          @compositionstart="composing = true"
          @compositionend="composing = false"
          @paste="paste"
        />
      </XTabsContent>
      <!-- 与 textarea 的 rows × leading-6 + 上下 py-3 保持一致。 -->
      <XTabsContent
        v-if="preview"
        value="preview"
        :style="{ '--markdown-editor-min-height': `${rows * 1.5 + 1.5}rem` }"
        :class="
          mergeClasses('min-h-(--markdown-editor-min-height) p-4', ui.preview)
        "
      >
        <XMarkdownContent
          v-if="model.trim()"
          :source="model"
          :markdown="markdown"
        />
        <p v-else class="text-sm text-muted">没有可预览的内容</p>
      </XTabsContent>
    </XTabs>
  </div>
</template>
