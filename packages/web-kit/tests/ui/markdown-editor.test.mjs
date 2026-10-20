import assert from 'node:assert/strict';
import test from 'node:test';
import * as Vue from 'vue';

import * as styleClasses from '../../src/ui/classes.ts';
import * as editing from '../../src/ui/markdown/editing.ts';
import { compileComponent } from '../helpers/compile-component.mjs';
import {
  classes,
  createTestRenderer,
  dispatch,
} from '../helpers/test-renderer.mjs';

// Tabs/Button 的交互由各自测试负责；这里只保留编辑器所需的模型和原生按钮。
const tabContext = Symbol('tabs');
const XTabs = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    Vue.provide(tabContext, {
      value: () => props.modelValue,
      select: (value) => emit('update:modelValue', value),
    });
    return () => Vue.h('div', slots.default?.());
  },
};
const XTabsTrigger = {
  props: ['value'],
  setup(props, { slots }) {
    const tabs = Vue.inject(tabContext);
    return () =>
      Vue.h(
        'button',
        { onClick: () => tabs.select(props.value) },
        slots.default?.(),
      );
  },
};
const XTabsContent = {
  props: { value: String, forceMount: Boolean },
  setup(props, { slots }) {
    const tabs = Vue.inject(tabContext);
    return () =>
      props.forceMount || tabs.value() === props.value
        ? Vue.h(
            'section',
            { hidden: tabs.value() !== props.value },
            slots.default?.(),
          )
        : null;
  },
};
const XButton = {
  props: ['variant', 'size'],
  setup:
    (_, { slots }) =>
    () =>
      Vue.h('button', { type: 'button' }, slots.default?.()),
};
const XMarkdownEditorToolButton = compileComponent(
  new URL(
    '../../src/ui/markdown/XMarkdownEditorToolButton.vue',
    import.meta.url,
  ),
  {
    vue: Vue,
    '../classes': styleClasses,
    '../button/XButton.vue': XButton,
    '../tooltip/XTooltip.vue': {
      setup:
        (_, { slots }) =>
        () =>
          slots.trigger?.(),
    },
  },
);
const XMarkdownEditor = compileComponent(
  new URL('../../src/ui/markdown/XMarkdownEditor.vue', import.meta.url),
  {
    vue: Vue,
    '../classes': styleClasses,
    './XMarkdownEditorToolButton.vue': XMarkdownEditorToolButton,
    './XMarkdownContent.vue': {
      props: ['source', 'markdown'],
      setup: (props) => () =>
        Vue.h('article', { markdown: props.markdown }, props.source),
    },
    '@vicons/material': {
      LinkOutlined: () => Vue.h('svg', { 'data-icon': 'link' }),
      StarBorderOutlined: () => Vue.h('svg', { 'data-icon': 'star' }),
      UnfoldMoreOutlined: () => Vue.h('svg', { 'data-icon': 'details' }),
      VisibilityOffOutlined: () => Vue.h('svg', { 'data-icon': 'spoiler' }),
    },
    '../tabs/XTabs.vue': XTabs,
    '../tabs/XTabsList.vue': {
      setup:
        (_, { slots }) =>
        () =>
          Vue.h('nav', slots.default?.()),
    },
    '../tabs/XTabsTrigger.vue': XTabsTrigger,
    '../tabs/XTabsContent.vue': XTabsContent,
    './editing': editing,
  },
);

function mount(t, initial = {}, slots = {}) {
  const { document, createApp, mount: mountApp } = createTestRenderer(t);
  const props = Vue.reactive({ ...initial });
  const events = [];
  const editor = Vue.ref();
  const app = createApp({
    render: () =>
      Vue.h(
        XMarkdownEditor,
        {
          ...props,
          ref: editor,
          'onUpdate:modelValue': (value) => {
            events.push(value);
            props.modelValue = value;
          },
        },
        slots,
      ),
  });
  const { root, unmount } = mountApp(app);
  const all = (node = root) => [
    node,
    ...node.children.flatMap((child) => all(child)),
  ];
  const find = (predicate) => all().find(predicate);
  return {
    root,
    textarea: find((node) => node.tag === 'textarea'),
    tool: (label) =>
      find(
        (node) => node.tag === 'button' && node.props['aria-label'] === label,
      ),
    tab: (text) =>
      find(
        (node) =>
          node.tag === 'button' &&
          (node.text?.trim() === text ||
            node.children.some((child) => child.text?.trim() === text)),
      ),
    find,
    props,
    events,
    document,
    editor: editor.value,
    unmount,
  };
}
const settle = async () => {
  await Vue.nextTick();
  await Vue.nextTick();
  await Vue.nextTick();
};

test('原生属性/监听器传给 textarea，布局和部位样式不串位', async (t) => {
  const focused = [];
  const attrs = {
    id: 'body',
    name: 'body',
    'aria-label': '正文',
    rows: 4,
    maxlength: 80,
  };
  const view = mount(t, {
    ...attrs,
    'aria-invalid': 'grammar',
    class: 'w-64',
    style: { marginTop: '4px' },
    sticky: true,
    stickyOffset: -3,
    onFocus: (event) => focused.push(event),
    ui: {
      root: 'rounded-lg',
      toolbar: 'bg-red-100',
      textarea: 'px-8',
      tool: 'text-red-500',
    },
  });
  const { root, textarea, props } = view;
  assert.deepEqual(root.props.style, { marginTop: '4px' });
  assert.ok(
    classes(root).includes('w-64') && classes(root).includes('rounded-lg'),
  );
  assert.equal(root.props.id, undefined);
  for (const [key, value] of Object.entries(attrs))
    assert.equal(textarea.props[key], value);
  assert.ok(
    classes(textarea).includes('px-8') && !classes(textarea).includes('px-3'),
  );
  assert.ok(!classes(textarea).includes('w-64'));
  const toolbar = view.find((node) => classes(node).includes('bg-red-100'));
  assert.deepEqual(toolbar.props.style, { top: '0px' });
  assert.ok(classes(view.tool('粗体')).includes('text-red-500'));
  assert.deepEqual(focused, [dispatch(textarea, 'focus')]);
  assert.equal(textarea.props['aria-invalid'], 'grammar');
  props.invalid = true;
  props.stickyOffset = 24;
  await Vue.nextTick();
  assert.equal(textarea.props['aria-invalid'], true);
  assert.ok(classes(root).includes('border-error'));
  assert.deepEqual(toolbar.props.style, { top: '24px' });
});

test('preview=false 时只显示编辑标签；空 tools 不产生空工具栏', async (t) => {
  const view = mount(t, { tools: [], preview: false });
  assert.equal(view.textarea.value, '');
  assert.ok(view.tab('编辑'));
  assert.equal(view.tab('预览'), undefined);
  assert.equal(
    view.find((node) => node.props.role === 'group'),
    undefined,
  );
  assert.equal(
    view.find((node) => node.tag === 'p' && node.text === '未配置预览内容'),
    undefined,
  );
  assert.equal(view.textarea.parent.props.hidden, false);
});

test('预览最小高度跟随 rows，与编辑区基础高度一致且可覆盖', async (t) => {
  const view = mount(t, { modelValue: '预览' });
  dispatch(view.tab('预览'), 'click');
  await Vue.nextTick();
  const preview = view.find((node) => node.tag === 'article').parent;
  assert.equal(preview.props.style['--markdown-editor-min-height'], '12rem');
  assert.ok(classes(preview).includes('min-h-(--markdown-editor-min-height)'));
  view.props.rows = 3;
  await Vue.nextTick();
  assert.equal(preview.props.style['--markdown-editor-min-height'], '6rem');
  view.props.ui = { preview: 'min-h-48' };
  await Vue.nextTick();
  assert.ok(classes(preview).includes('min-h-48'));
  assert.ok(!classes(preview).includes('min-h-(--markdown-editor-min-height)'));
});

test('默认提供预览，空白内容显示统一提示', async (t) => {
  const view = mount(t, { modelValue: '  \n' });
  assert.ok(view.tab('预览'));
  dispatch(view.tab('预览'), 'click');
  await Vue.nextTick();
  assert.equal(view.find((node) => node.tag === 'p').text, '没有可预览的内容');
  assert.equal(
    view.find((node) => node.tag === 'article'),
    undefined,
  );
});

test('关闭 preview 后回到编辑标签', async (t) => {
  const view = mount(t, { modelValue: '原文' });
  dispatch(view.tab('预览'), 'click');
  await Vue.nextTick();
  assert.equal(view.textarea.parent.props.hidden, true);
  view.props.preview = false;
  view.props.modelValue = '更新';
  await settle();
  assert.equal(view.tab('预览'), undefined);
  assert.equal(
    view.find((node) => node.tag === 'article'),
    undefined,
  );
  assert.equal(view.textarea.parent.props.hidden, false);
});

test('内置预览同步源码和解析器，toolbar 获得操作，focus 恢复编辑', async (t) => {
  let actions;
  const view = mount(
    t,
    { modelValue: '原文', tools: [] },
    {
      toolbar: (value) => {
        actions = value;
        return Vue.h('b', '自定义工具');
      },
    },
  );
  assert.equal(actions.wrapSelection, view.editor.wrapSelection);
  assert.equal(actions.insertBlock, view.editor.insertBlock);
  const tools = view.find((node) => node.props.role === 'group');
  dispatch(view.tab('预览'), 'click');
  await Vue.nextTick();
  assert.equal(view.find((node) => node.tag === 'article').text, '原文');
  assert.equal(view.textarea.parent.props.hidden, true);
  assert.equal(tools.props.inert, true);
  assert.equal(tools.props['aria-hidden'], true);
  view.props.modelValue = '更新';
  await Vue.nextTick();
  assert.equal(view.find((node) => node.tag === 'article').text, '更新');
  const markdown = Vue.markRaw({ render: (source) => source });
  view.props.markdown = markdown;
  await Vue.nextTick();
  assert.equal(
    view.find((node) => node.tag === 'article').props.markdown,
    markdown,
  );
  assert.equal(view.textarea.props.markdown, undefined);
  assert.equal(view.textarea.props.preview, undefined);
  await view.editor.focus();
  assert.equal(tools.props.inert, false);
  assert.equal(tools.props['aria-hidden'], undefined);
  assert.equal(view.textarea.parent.props.hidden, false);
  assert.equal(view.document.activeElement, view.textarea);
  view.editor.blur();
  assert.equal(view.document.activeElement, null);
});

test('工具阻止 mousedown 丢失选区，但由 click 激活以兼容键盘', async (t) => {
  const view = mount(t, { modelValue: '前文字后', tools: ['bold', 'link'] });
  assert.equal(view.tool('链接').props.type, 'button');
  view.textarea.setSelectionRange(1, 3);
  assert.equal(dispatch(view.tool('粗体'), 'mousedown').defaultPrevented, true);
  assert.deepEqual(view.events, []);
  // 键盘生成的 click 没有先行 mousedown，同样必须生效。
  dispatch(view.tool('粗体'), 'click');
  await settle();
  assert.equal(view.props.modelValue, '前**文字**后');
  assert.deepEqual(view.events, ['前**文字**后']);
  assert.deepEqual(
    [view.textarea.selectionStart, view.textarea.selectionEnd],
    [3, 5],
  );
  view.textarea.setSelectionRange(0, 0);
  dispatch(view.tool('链接'), 'click');
  await settle();
  assert.equal(view.props.modelValue, '[链接文字](https://)前**文字**后');
  assert.deepEqual(
    [view.textarea.selectionStart, view.textarea.selectionEnd],
    [1, 5],
  );
});

test('扩展工具默认关闭，显式配置后遵循顺序、样式和插入语法', async (t) => {
  const view = mount(t);
  for (const label of ['粗体', '斜体', '删除线', '行内代码', '链接'])
    assert.ok(view.tool(label));
  for (const label of ['剧透', '评分', '折叠内容'])
    assert.equal(view.tool(label), undefined);

  view.props.tools = ['details', 'spoiler', 'star'];
  view.props.ui = { tool: 'text-red-500' };
  await Vue.nextTick();
  const group = view.find((node) => node.props.role === 'group');
  assert.deepEqual(
    group.children
      .filter((node) => node.tag === 'button')
      .map((node) => node.props['aria-label']),
    ['折叠内容', '剧透', '评分'],
  );
  for (const [label, source, start, end, expected] of [
    ['剧透', '前文字后', 1, 3, '前!!文字!!后'],
    ['评分', '前后', 1, 1, '前\n::: star 5\n后'],
    ['折叠内容', '前后', 1, 1, '前\n::: details 点击展开\n折叠内容\n:::\n后'],
  ]) {
    view.props.modelValue = source;
    await Vue.nextTick();
    view.textarea.setSelectionRange(start, end);
    assert.ok(classes(view.tool(label)).includes('text-red-500'));
    dispatch(view.tool(label), 'click');
    await settle();
    assert.equal(view.props.modelValue, expected);
  }
});

test('公开选区包裹和块插入保持模型同步、占位选区与必要换行', async (t) => {
  const view = mount(t, { modelValue: '前后' });
  view.textarea.setSelectionRange(1, 1);
  assert.equal(await view.editor.insertBlock('```\n', '\n```', '代码'), true);
  assert.equal(view.props.modelValue, '前\n```\n代码\n```\n后');
  assert.deepEqual(
    [view.textarea.selectionStart, view.textarea.selectionEnd],
    [6, 8],
  );
  assert.equal(await view.editor.wrapSelection('**', '**'), true);
  assert.equal(view.props.modelValue, '前\n```\n**代码**\n```\n后');
  view.props.modelValue = '前\n后';
  await Vue.nextTick();
  view.textarea.setSelectionRange(2, 2);
  assert.equal(await view.editor.insertBlock('# ', '', '标题'), true);
  assert.equal(view.props.modelValue, '前\n# 标题\n后');
});

test('disabled/readonly/组合输入拒绝工具和公开操作；maxlength 拒绝超长插入', async (t) => {
  let actions;
  const view = mount(
    t,
    {
      modelValue: '文字',
      maxlength: 5,
      tools: ['bold', 'spoiler', 'star', 'details'],
    },
    {
      toolbar: (value) => {
        actions = value;
        return null;
      },
    },
  );
  view.textarea.setSelectionRange(0, 2);
  const labels = ['粗体', '剧透', '评分', '折叠内容'];
  const oldClicks = labels.map((label) => view.tool(label).props.onClick);
  for (const state of ['disabled', 'readonly', 'composing']) {
    if (state === 'composing') dispatch(view.textarea, 'compositionstart');
    else view.props[state] = true;
    await Vue.nextTick();
    assert.equal(actions.disabled, true);
    for (const label of labels)
      assert.equal(view.tool(label).props.disabled, true);
    oldClicks.forEach((click) => click());
    assert.equal(await view.editor.wrapSelection('*', '*'), false);
    assert.equal(await view.editor.insertBlock('# '), false);
    await settle();
    assert.deepEqual(view.events, []);
    if (state === 'composing') dispatch(view.textarea, 'compositionend');
    else view.props[state] = false;
    await Vue.nextTick();
  }
  assert.equal(actions.disabled, false);
  assert.equal(await view.editor.wrapSelection('**', '**'), false);
  assert.deepEqual(view.events, []);
  assert.equal(await view.editor.wrapSelection('*', '*'), true);
  assert.equal(view.props.modelValue, '*文字*');
});

test('textarea 输入与粘贴同步模型，IME 期间延迟提交且不转换粘贴', async (t) => {
  const view = mount(t, { modelValue: '初始' });
  view.document.execCommand = (_, __, text) => {
    const { textarea } = view;
    textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd);
    dispatch(textarea, 'input');
    return true;
  };
  const paste = () => {
    const event = Object.assign(new Event('paste', { cancelable: true }), {
      clipboardData: { getData: () => 'https://example.com' },
    });
    view.textarea.dispatchEvent(event);
    return event;
  };
  view.textarea.value = '001';
  dispatch(view.textarea, 'input');
  await Vue.nextTick();
  assert.deepEqual(view.events, ['001']);
  view.props.modelValue = '外部';
  await Vue.nextTick();
  assert.equal(view.textarea.value, '外部');
  view.textarea.focus();
  view.textarea.setSelectionRange(0, 2);
  dispatch(view.textarea, 'compositionstart');
  assert.equal(paste().defaultPrevented, false);
  view.textarea.value = 'zhong';
  dispatch(view.textarea, 'input');
  assert.deepEqual(view.events, ['001']);
  view.textarea.value = '中文';
  dispatch(view.textarea, 'compositionend');
  await Vue.nextTick();
  assert.deepEqual(view.events, ['001', '中文']);
  assert.equal(paste().defaultPrevented, true);
  await Vue.nextTick();
  assert.deepEqual(view.events, [
    '001',
    '中文',
    '[中文](https://example.com/)',
  ]);
});

test('sticky 工具栏越过偏移后标记 stuck，关闭 sticky 时断开观察', async (t) => {
  const previous = Object.getOwnPropertyDescriptor(
    globalThis,
    'IntersectionObserver',
  );
  let observer;
  class IntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      observer = this;
    }
    observe(node) {
      this.node = node;
    }
    disconnect() {
      this.disconnected = true;
    }
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    value: IntersectionObserver,
  });
  t.after(() =>
    previous
      ? Object.defineProperty(globalThis, 'IntersectionObserver', previous)
      : delete globalThis.IntersectionObserver,
  );
  const view = mount(t, { sticky: true, stickyOffset: 50 });
  const toolbar = view.find((node) => classes(node).includes('bg-body'));
  assert.ok(classes(view.root).includes('relative'));
  assert.equal(observer.options.root, null);
  assert.equal(observer.options.rootMargin, '-50px 0px 0px 0px');
  assert.equal(
    observer.node,
    view.find((node) => classes(node).includes('h-px')),
  );
  observer.callback([
    {
      isIntersecting: false,
      boundingClientRect: { top: 10 },
      rootBounds: { top: 50 },
    },
  ]);
  await Vue.nextTick();
  assert.equal(toolbar.props['data-stuck'], true);
  assert.ok(
    classes(toolbar).includes('shadow-[0_4px_10px_-6px_rgb(0_0_0_/_0.3)]'),
  );
  observer.callback([
    {
      isIntersecting: true,
      boundingClientRect: { top: 60 },
      rootBounds: { top: 50 },
    },
  ]);
  await Vue.nextTick();
  assert.equal(toolbar.props['data-stuck'], undefined);
  assert.ok(
    !classes(toolbar).includes('shadow-[0_4px_10px_-6px_rgb(0_0_0_/_0.3)]'),
  );
  view.props.sticky = false;
  await settle();
  assert.equal(observer.disconnected, true);
  assert.equal(toolbar.props['data-stuck'], undefined);
});

test('autosize 随内容/宽度更新，关闭后清高度，卸载断开 observer', async (t) => {
  const previous = Object.getOwnPropertyDescriptor(
    globalThis,
    'ResizeObserver',
  );
  let observer;
  class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
      observer = this;
    }
    observe(node) {
      this.node = node;
    }
    disconnect() {
      this.disconnected = true;
    }
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: ResizeObserver,
  });
  t.after(() =>
    previous
      ? Object.defineProperty(globalThis, 'ResizeObserver', previous)
      : delete globalThis.ResizeObserver,
  );
  const view = mount(t);
  assert.equal(observer.node, view.root);
  assert.equal(view.textarea.style.height, '96px');
  view.textarea.scrollHeight = 144;
  observer.callback([{ contentRect: { width: 300 } }]);
  assert.equal(view.textarea.style.height, '144px');
  view.textarea.scrollHeight = 180;
  observer.callback([{ contentRect: { width: 300 } }]);
  assert.equal(view.textarea.style.height, '144px');
  view.props.modelValue = '更多内容';
  await Vue.nextTick();
  assert.equal(view.textarea.style.height, '180px');
  view.props.autosize = false;
  await Vue.nextTick();
  assert.equal(view.textarea.style.height, '');
  assert.ok(classes(view.textarea).includes('resize-y'));
  view.unmount();
  assert.equal(observer.disconnected, true);
});
