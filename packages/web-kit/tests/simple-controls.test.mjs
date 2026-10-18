import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as Vue from 'vue';
import { compileScript, parse, registerTS } from 'vue/compiler-sfc';
import { renderToString } from 'vue/server-renderer';
import ts from 'typescript';

registerTS(() => ts);

// Only test wrapper logic; Reka owns keyboard, pointer and rendering behavior.
async function setup(kind, modelValue) {
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
  const filename = fileURLToPath(
    new URL(`../src/ui/${kind.toLowerCase()}/X${kind}.vue`, import.meta.url),
  );
  const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename });
  const script = compileScript(descriptor, { id: kind, inlineTemplate: true });
  const { outputText } = ts.transpileModule(script.content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const dependencies = {
    vue: Vue,
    'reka-ui': {
      [`${kind}Root`]: stub,
      [`${kind}Thumb`]: passThrough,
      SliderTrack: passThrough,
      SliderRange: passThrough,
    },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(
    (name) => {
      assert.ok(name in dependencies, `Unexpected import: ${name}`);
      return dependencies[name];
    },
    module,
    module.exports,
  );
  const events = [];
  await renderToString(
    Vue.createSSRApp({
      render: () =>
        Vue.h(module.exports.default, {
          modelValue,
          'onUpdate:modelValue': (value) => events.push(['update', value]),
          onCommit: (value) => events.push(['commit', value]),
        }),
    }),
  );
  return { ...root, events };
}

test('Slider 对外为数字模型，拖动只更新，提交时先更新再触发 commit', async () => {
  const { props, emit, events } = await setup('Slider', 20);
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

test('Switch 默认关闭，仅更新布尔模型', async () => {
  const { props, emit, events } = await setup('Switch');
  assert.equal(props.modelValue, false);
  emit('update:modelValue', true);
  assert.deepEqual(events, [['update', true]]);
});
