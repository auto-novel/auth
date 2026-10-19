import * as styleClasses from '../../src/ui/classes.ts';
import { compileComponent } from '../helpers/compile-component.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import * as Vue from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider, useDirection } from 'reka-ui';
import * as variants from '../../src/ui/slider/variants.ts';

// Only test wrapper logic; Reka owns keyboard, pointer and rendering behavior.
async function setup(props, providerDir) {
  let root;
  const passThrough = {
    setup:
      (_, { slots }) =>
      () =>
        Vue.h('div', slots.default?.()),
  };
  const stub = {
    props: ['modelValue'],
    emits: ['update:modelValue', 'valueCommit'],
    setup(props, { attrs, emit, slots }) {
      root = { props, attrs, emit };
      return () => Vue.h('div', slots.default?.());
    },
  };
  const dependencies = {
    vue: Vue,
    '../classes': styleClasses,
    './variants': variants,
    'reka-ui': {
      SliderRoot: stub,
      SliderThumb: passThrough,
      SliderTrack: passThrough,
      SliderRange: passThrough,
      useDirection,
    },
  };
  const XSlider = compileComponent(
    new URL('../../src/ui/slider/XSlider.vue', import.meta.url),
    dependencies,
  );
  const events = [];
  const renderSlider = () =>
    Vue.h(XSlider, {
      ...props,
      'onUpdate:modelValue': (value) => events.push(['update', value]),
      onCommit: (value) => events.push(['commit', value]),
    });
  const html = await renderToString(
    Vue.createSSRApp({
      render: () =>
        providerDir
          ? Vue.h(
              ConfigProvider,
              { dir: providerDir },
              { default: renderSlider },
            )
          : renderSlider(),
    }),
  );
  return { ...root, events, html };
}

test('Slider 根节点与部位样式覆盖经过冲突合并', async () => {
  const { attrs, html } = await setup({
    class: ['w-64', { 'h-10': true }],
    ui: { thumb: 'size-6', track: 'h-2' },
  });
  const rootClasses = attrs.class.split(/\s+/);
  assert.ok(rootClasses.includes('w-64'));
  assert.ok(rootClasses.includes('h-10'));
  assert.ok(!rootClasses.includes('w-full'));
  assert.ok(!rootClasses.includes('h-6'));
  assert.match(html, /\bsize-6\b/);
  assert.match(html, /\bh-2\b/);
  assert.doesNotMatch(html, /\bsize-4\b/);
  assert.doesNotMatch(html, /\bh-1\b/);
});

test('Slider 对外为数字模型，拖动只更新，提交时先更新再触发 commit', async () => {
  const { props, emit, events } = await setup({ modelValue: 20 });
  assert.deepEqual(props.modelValue, [20]);
  emit('update:modelValue', undefined);
  emit('update:modelValue', []);
  assert.deepEqual(events, []);
  emit('update:modelValue', [30]);
  assert.deepEqual(events, [['update', 30]]);
  // Reka can commit keyboard changes before update:modelValue.
  emit('valueCommit', [40]);
  assert.deepEqual(events.slice(-2), [
    ['update', 40],
    ['commit', 40],
  ]);
});

test('未设置值时按 min 呈现，交互后才产出数值', async () => {
  const { props, emit, events } = await setup({ modelValue: null, min: 10 });
  assert.deepEqual(props.modelValue, [10]);
  assert.deepEqual(events, []);
  emit('update:modelValue', [12]);
  assert.deepEqual(events, [['update', 12]]);
});

test('snapToMarks 吸附最近刻度', async () => {
  const { emit, events } = await setup({
    modelValue: 30,
    marks: { 0: '低', 50: '中', 100: '高' },
    snapToMarks: true,
  });
  emit('update:modelValue', [38]);
  emit('valueCommit', [90]);
  assert.deepEqual(events, [
    ['update', 50],
    ['update', 100],
    ['commit', 100],
  ]);
});

test('snapToMarks 下键盘跳到相邻刻度，回放的 update 不会抵消它', async () => {
  const { attrs, emit, events } = await setup({
    modelValue: 50,
    marks: { 0: '低', 50: '中', 100: '高' },
    snapToMarks: true,
  });
  // Reka 的键盘提交：先 valueCommit，再 update:modelValue 回放同一个原始值。
  attrs.onKeydownCapture();
  emit('valueCommit', [51]);
  emit('update:modelValue', [51]);
  assert.deepEqual(events, [
    ['update', 100],
    ['commit', 100],
  ]);
  // 指针拖动仍按最近刻度吸附到 50，与当前值相同，不产生新事件。
  attrs.onPointerdownCapture();
  emit('update:modelValue', [51]);
  assert.deepEqual(events.at(-1), ['commit', 100]);
});

test('表单字段不使用默认整数步长校验小数值', async () => {
  const { html } = await setup({
    modelValue: 0.15,
    min: 0.05,
    max: 1.05,
    step: 0.1,
    name: 'decimal',
  });
  const input = html.match(/<input\b[^>]*>/)?.[0];
  assert.ok(input);
  assert.match(input, /type="number"/);
  assert.match(input, /step="any"/);
  assert.match(input, /value="0\.15"/);
});

test('刻度方向与横向 RTL、反向及纵向组合保持一致', async () => {
  for (const orientation of ['horizontal', 'vertical']) {
    for (const dir of ['ltr', 'rtl']) {
      for (const inverted of [false, true]) {
        const { html } = await setup({
          orientation,
          dir,
          inverted,
          marks: { 20: '低', 80: '高' },
        });
        const reversed =
          orientation === 'vertical' ? inverted : inverted !== (dir === 'rtl');
        const edge = orientation === 'vertical' ? 'bottom' : 'left';
        const context = `${orientation}/${dir}/inverted=${inverted}`;
        assert.match(
          html,
          new RegExp(`style="${edge}:${reversed ? 80 : 20}%;">低</span>`),
          context,
        );
        assert.match(
          html,
          new RegExp(`style="${edge}:${reversed ? 20 : 80}%;">高</span>`),
          context,
        );
      }
    }
  }
});

test('刻度与根节点使用 ConfigProvider 方向，显式 dir 优先', async () => {
  const inherited = await setup({ marks: { 20: '低' } }, 'rtl');
  assert.equal(inherited.attrs.dir, 'rtl');
  assert.match(inherited.html, /style="left:80%;">低<\/span>/);

  const explicit = await setup({ dir: 'ltr', marks: { 20: '低' } }, 'rtl');
  assert.equal(explicit.attrs.dir, 'ltr');
  assert.match(explicit.html, /style="left:20%;">低<\/span>/);
});

test('刻度文案、常显气泡与 name 生成的表单字段都会渲染', async () => {
  const { html } = await setup({
    modelValue: 30,
    marks: { 0: '低', 50: '中', 100: '高' },
    tooltip: 'always',
    formatValue: (value) => `${value}%`,
    name: 'volume',
  });
  assert.match(html, /中/);
  assert.match(html, />30%</);
  assert.match(html, /name="volume"/);

  const { html: plain } = await setup({
    modelValue: 30,
    formatValue: (value) => `${value}%`,
  });
  assert.doesNotMatch(plain, />30%</);
});
