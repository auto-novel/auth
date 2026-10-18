import { compileComponent } from '../helpers/compile-component.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import * as Vue from 'vue';
import { renderToString } from 'vue/server-renderer';

// Only test wrapper logic; Reka owns keyboard, pointer and rendering behavior.
async function setup(modelValue) {
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
    setup(props, { emit, slots }) {
      root = { props, emit };
      return () => Vue.h('div', slots.default?.());
    },
  };
  const dependencies = {
    vue: Vue,
    'reka-ui': {
      SliderRoot: stub,
      SliderThumb: passThrough,
      SliderTrack: passThrough,
      SliderRange: passThrough,
    },
  };
  const XSlider = compileComponent(
    new URL('../../src/ui/slider/XSlider.vue', import.meta.url),
    dependencies,
  );
  const events = [];
  await renderToString(
    Vue.createSSRApp({
      render: () =>
        Vue.h(XSlider, {
          modelValue,
          'onUpdate:modelValue': (value) => events.push(['update', value]),
          onCommit: (value) => events.push(['commit', value]),
        }),
    }),
  );
  return { ...root, events };
}

test('Slider 对外为数字模型，拖动只更新，提交时先更新再触发 commit', async () => {
  const { props, emit, events } = await setup(20);
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
