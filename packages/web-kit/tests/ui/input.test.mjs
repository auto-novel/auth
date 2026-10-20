import assert from 'node:assert/strict';
import test from 'node:test';
import * as Vue from 'vue';

import * as styleClasses from '../../src/ui/classes.ts';
import { compileComponent } from '../helpers/compile-component.mjs';
import {
  classes,
  createTestRenderer,
  dispatch,
} from '../helpers/test-renderer.mjs';

const XInput = compileComponent(
  new URL('../../src/ui/input/XInput.vue', import.meta.url),
  {
    vue: Vue,
    '../classes': styleClasses,
    '@vicons/material': { CloseOutlined: () => Vue.h('svg') },
  },
);

function mount(t, initial = {}, slots = {}) {
  const { document, createApp, mount: mountApp } = createTestRenderer(t);
  const events = [];
  const props = Vue.reactive({ ...initial });
  const app = createApp({
    render: () =>
      Vue.h(
        XInput,
        {
          ...props,
          'onUpdate:modelValue': (value) => {
            events.push(['update', value]);
            props.modelValue = value;
          },
          onClear: () => events.push(['clear']),
        },
        slots,
      ),
  });
  const { root } = mountApp(app);
  return {
    root,
    input: root.children.find((node) => node.tag === 'input'),
    button: () => root.children.find((node) => node.tag === 'button'),
    props,
    events,
    document,
  };
}

test('Input 将原生属性及事件交给 input，class/style 和各部位样式不串位', (t) => {
  const received = [];
  const { root, input, button } = mount(
    t,
    {
      id: 'email',
      name: 'email',
      type: 'email',
      placeholder: '请输入邮箱',
      autocomplete: 'email',
      'aria-label': '邮箱',
      onFocus: (event) => received.push(event),
      class: ['w-64', { 'px-8': true }],
      style: { marginTop: '4px' },
      size: 'sm',
      modelValue: 'a@example.com',
      clearable: true,
      ui: {
        root: 'rounded-lg',
        input: 'py-3',
        prefix: 'text-primary',
        suffix: 'text-error',
        clear: 'size-7',
      },
    },
    {
      prefix: () => Vue.h('b', '前缀'),
      suffix: () => Vue.h('i', '后缀'),
    },
  );
  assert.deepEqual(root.props.style, { marginTop: '4px' });
  assert.ok(classes(root).includes('w-64'));
  assert.ok(classes(root).includes('px-8'));
  assert.ok(classes(root).includes('rounded-lg'));
  assert.ok(classes(root).includes('min-h-9'));
  assert.ok(!classes(root).includes('w-full'));
  assert.ok(!classes(root).includes('px-2.5'));
  assert.equal(root.props.id, undefined);
  for (const [key, value] of Object.entries({
    id: 'email',
    name: 'email',
    type: 'email',
    placeholder: '请输入邮箱',
    autocomplete: 'email',
    'aria-label': '邮箱',
  }))
    assert.equal(input.props[key], value);
  assert.deepEqual(input.props.style, {});
  assert.ok(classes(input).includes('py-3'));
  assert.ok(!classes(input).includes('py-1.5'));
  assert.ok(!classes(input).includes('px-8'));
  const spans = root.children.filter((node) => node.tag === 'span');
  assert.ok(classes(spans[0]).includes('text-primary'));
  assert.equal(spans[0].children.find((node) => node.tag === 'b').text, '前缀');
  assert.ok(classes(spans[1]).includes('text-error'));
  assert.equal(spans[1].children.find((node) => node.tag === 'i').text, '后缀');
  assert.ok(classes(button()).includes('size-7'));
  const event = dispatch(input, 'focus');
  assert.deepEqual(received, [event]);
});

test('默认值为空、无空 slots；invalid 优先于原生 aria-invalid', async (t) => {
  const { root, input, button, props } = mount(t, {
    clearable: true,
    'aria-invalid': 'grammar',
  });
  assert.equal(input.value, '');
  assert.equal(input.props.type, 'text');
  assert.equal(button(), undefined);
  assert.equal(root.children.filter((node) => node.tag === 'span').length, 0);
  assert.equal(input.props['aria-invalid'], 'grammar');
  props.invalid = true;
  await Vue.nextTick();
  assert.equal(input.props['aria-invalid'], true);
  assert.ok(classes(root).includes('border-error'));
  assert.ok(!classes(root).includes('border-border'));
});

test('原生 v-model 保留字符串，响应外部更新，中文组合期间不提前提交', async (t) => {
  const { input, props, events } = mount(t, { modelValue: '初始' });
  assert.equal(input.value, '初始');
  input.value = '001';
  dispatch(input, 'input');
  await Vue.nextTick();
  assert.deepEqual(events, [['update', '001']]);
  props.modelValue = '外部更新';
  await Vue.nextTick();
  assert.equal(input.value, '外部更新');
  dispatch(input, 'compositionstart');
  input.value = 'zhong';
  dispatch(input, 'input');
  await Vue.nextTick();
  assert.equal(events.length, 1);
  assert.equal(props.modelValue, '外部更新');
  input.value = '中文';
  dispatch(input, 'compositionend');
  await Vue.nextTick();
  assert.deepEqual(events, [
    ['update', '001'],
    ['update', '中文'],
  ]);
  assert.equal(props.modelValue, '中文');
});

test('清空阻止鼠标按下默认行为，先更新模型再发 clear，并聚焦输入框', async (t) => {
  const { input, button, events, document } = mount(t, {
    modelValue: '内容',
    clearable: true,
    clearLabel: '清除此项',
  });
  assert.equal(button().props.type, 'button');
  assert.equal(button().props['aria-label'], '清除此项');
  assert.equal(dispatch(button(), 'mousedown').defaultPrevented, true);
  dispatch(button(), 'click');
  await Vue.nextTick();
  assert.deepEqual(events, [['update', ''], ['clear']]);
  assert.equal(input.value, '');
  assert.equal(document.activeElement, input);
  assert.equal(button(), undefined);
});

test('readonly/disabled 隐藏清空按钮且拒绝旧按钮回调，解除后恢复', async (t) => {
  const { root, input, button, props, events } = mount(t, {
    modelValue: '保留',
    clearable: true,
  });
  assert.equal(button().props['aria-label'], '清空输入');
  for (const state of ['readonly', 'disabled']) {
    const previousButton = button();
    props[state] = true;
    await Vue.nextTick();
    assert.equal(input.props[state], true);
    assert.equal(button(), undefined);
    dispatch(previousButton, 'click');
    assert.deepEqual(events, []);
    assert.equal(input.value, '保留');
    if (state === 'disabled') {
      assert.ok(classes(root).includes('cursor-not-allowed'));
      assert.ok(!classes(root).includes('focus-within:border-primary'));
    }
    props[state] = false;
    await Vue.nextTick();
    assert.ok(button());
  }
  props.clearable = false;
  await Vue.nextTick();
  assert.equal(button(), undefined);
});
