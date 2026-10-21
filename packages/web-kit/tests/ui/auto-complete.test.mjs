import assert from 'node:assert/strict';
import test from 'node:test';
import * as Vue from 'vue';

import * as styleClasses from '../../src/ui/classes.ts';
import * as field from '../../src/ui/field.ts';
import { useOverlayLayer } from '../../src/ui/overlayLayer.ts';
import { compileComponent } from '../helpers/compile-component.mjs';
import { createTestRenderer, dispatch } from '../helpers/test-renderer.mjs';

// 只测封装的过滤、模型及编辑限制；键盘、IME 和 Portal 由 Reka 负责。
function mount(t, initial = {}) {
  const controls = {};
  function stub(name, tag, props = []) {
    return {
      props,
      setup(props, { attrs, slots, emit }) {
        controls[name] = { props, emit };
        return () => Vue.h(tag, { ...props, ...attrs }, slots.default?.());
      },
    };
  }
  const passThrough = (_, { slots }) => slots.default?.();
  const XAutoComplete = compileComponent(
    new URL('../../src/ui/auto-complete/XAutoComplete.vue', import.meta.url),
    {
      vue: Vue,
      '../classes': styleClasses,
      '../field': field,
      '../overlayLayer': { useOverlayLayer },
      '@vicons/material': { CloseOutlined: () => Vue.h('svg') },
      'reka-ui': {
        ComboboxRoot: stub('root', 'section', ['open']),
        ComboboxInput: stub('input', 'input', ['modelValue']),
        ComboboxItem: stub('item', 'option', ['value', 'disabled']),
        ComboboxAnchor: passThrough,
        ComboboxContent: passThrough,
        ComboboxPortal: passThrough,
        ComboboxViewport: passThrough,
      },
    },
  );
  const props = Vue.reactive({ options: ['Vue', 'Vite', '中文'], ...initial });
  const events = [];
  const { createApp, mount: mountApp, document } = createTestRenderer(t);
  const { root } = mountApp(
    createApp({
      render: () =>
        Vue.h(XAutoComplete, {
          ...props,
          'onUpdate:modelValue': (value) => {
            props.modelValue = value;
            events.push(['update', value]);
          },
          onSearch: (value) => events.push(['search', value]),
          onSelect: (option) => events.push(['select', option]),
          onClear: () => events.push(['clear']),
        }),
    }),
  );
  function nodes(tag, node = root) {
    return [
      node,
      ...node.children.flatMap((child) => nodes(tag, child)),
    ].filter((child) => child.tag === tag);
  }
  return { props, events, controls, document, nodes };
}

test('聚焦不自动展开，保留点击展开及 Reka 的开关请求', async (t) => {
  const { controls, nodes } = mount(t);
  assert.equal(nodes('section')[0].props['open-on-focus'], false);
  assert.equal(nodes('section')[0].props['open-on-click'], '');
  dispatch(nodes('input')[0], 'focus');
  await Vue.nextTick();
  assert.equal(controls.root.props.open, false);
  controls.root.emit('update:open', true);
  await Vue.nextTick();
  assert.equal(controls.root.props.open, true);
});

test('默认过滤 label/value 并忽略空候选；支持不过滤和自定义过滤', async (t) => {
  const option = { value: 'vue', label: '渐进式框架', disabled: true };
  const { props, nodes } = mount(t, {
    modelValue: '框架',
    options: [option, 'Vite', ''],
  });
  const values = () => nodes('option').map((node) => node.props.value);
  assert.deepEqual(values(), ['vue']);
  assert.equal(nodes('option')[0].props.disabled, true);
  props.modelValue = 'V';
  await Vue.nextTick();
  assert.deepEqual(values(), ['vue', 'Vite']);
  props.modelValue = '不存在';
  await Vue.nextTick();
  assert.deepEqual(values(), []);
  props.filter = false;
  await Vue.nextTick();
  assert.deepEqual(values(), ['vue', 'Vite']);
  props.filter = (query, item) => query === '不存在' && item.value === 'Vite';
  await Vue.nextTick();
  assert.deepEqual(values(), ['Vite']);
});

test('自由输入触发 search，选择提交 value，清空更新模型并恢复焦点', async (t) => {
  const option = { value: 'vue', label: '框架' };
  const { controls, nodes, props, events, document } = mount(t, {
    options: [option],
    clearable: true,
    id: 'keyword',
    class: 'w-64',
  });
  assert.equal(controls.input.props.modelValue, '');
  assert.equal(nodes('input')[0].props.id, 'keyword');
  assert.ok(!nodes('input')[0].props.class.includes('w-64'));
  assert.equal(nodes('section')[0].props['reset-search-term-on-blur'], false);
  controls.input.emit('update:modelValue', '001');
  await Vue.nextTick();
  assert.deepEqual(events, [
    ['update', '001'],
    ['search', '001'],
  ]);
  props.modelValue = '框架';
  await Vue.nextTick();
  assert.equal(controls.input.props.modelValue, '框架');
  controls.root.emit('update:open', true);
  await Vue.nextTick();
  assert.equal(dispatch(nodes('option')[0], 'select').defaultPrevented, true);
  await Vue.nextTick();
  assert.deepEqual(events.slice(-2), [
    ['update', 'vue'],
    ['select', option],
  ]);
  assert.equal(controls.root.props.open, false);
  dispatch(nodes('button')[0], 'click');
  await Vue.nextTick();
  assert.deepEqual(events.slice(-3), [
    ['update', ''],
    ['search', ''],
    ['clear'],
  ]);
  assert.equal(document.activeElement, nodes('input')[0]);
});

test('禁用/只读关闭弹层，拒绝输入、选中及旧清空回调；禁用候选不提交', async (t) => {
  const { props, controls, nodes, events } = mount(t, {
    modelValue: 'Vue',
    clearable: true,
    options: [{ value: 'Vue', disabled: true }],
  });
  dispatch(nodes('option')[0], 'select');
  assert.deepEqual(events, []);
  props.options = ['Vue'];
  await Vue.nextTick();
  for (const state of ['disabled', 'readonly']) {
    controls.root.emit('update:open', true);
    await Vue.nextTick();
    const button = nodes('button')[0];
    props[state] = true;
    await Vue.nextTick();
    assert.equal(controls.root.props.open, false);
    assert.equal(nodes('button').length, 0);
    controls.root.emit('update:open', true);
    controls.input.emit('update:modelValue', '拒绝');
    dispatch(nodes('option')[0], 'select');
    dispatch(button, 'click');
    await Vue.nextTick();
    assert.equal(controls.root.props.open, false);
    assert.deepEqual(events, []);
    props[state] = false;
    await Vue.nextTick();
  }
});
