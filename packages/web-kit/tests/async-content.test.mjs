import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as Vue from 'vue';
import { compileScript, parse, registerTS } from 'vue/compiler-sfc';
import { renderToString } from 'vue/server-renderer';
import ts from 'typescript';

registerTS(() => ts);

const filename = fileURLToPath(
  new URL('../src/ui/XAsyncContent.vue', import.meta.url),
);
const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename });
const script = compileScript(descriptor, {
  id: 'async-content',
  inlineTemplate: true,
});
const { outputText } = ts.transpileModule(script.content, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});

async function render(props = {}, slots = {}) {
  let clickRetry;
  let retryCount = 0;
  const dependencies = {
    vue: Vue,
    '@vicons/material': {
      Inventory2Outlined: () => Vue.h('svg', { 'data-empty-icon': '' }),
    },
    './XButton.vue': {
      emits: ['click'],
      setup(_, { emit, slots }) {
        clickRetry = () => emit('click');
        return () => Vue.h('button', slots.default?.());
      },
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
  const html = await renderToString(
    Vue.createSSRApp({
      render: () =>
        Vue.h(
          module.exports.default,
          {
            loading: false,
            onRetry: () => retryCount++,
            ...props,
          },
          { default: () => Vue.h('article', '成功内容'), ...slots },
        ),
    }),
  );
  return { html, clickRetry, retryCount: () => retryCount };
}

test('加载中默认提供可访问的加载指示，优先于错误、空态与内容', async () => {
  const { html, clickRetry } = await render({
    loading: true,
    error: '请求错误',
    empty: true,
  });
  assert.match(html, /role="status"/);
  assert.match(html, /正在加载…/);
  assert.match(html, /animate-spin/);
  assert.match(html, /motion-reduce:animate-none/);
  assert.match(html, /aria-hidden="true"/);
  assert.doesNotMatch(html, /请求错误|暂无内容|成功内容/);
  assert.equal(clickRetry, undefined);
});

test('自定义 loading 插槽完全替换默认加载界面', async () => {
  const { html } = await render(
    { loading: true },
    { loading: () => Vue.h('div', { 'data-skeleton': '' }, '自定义骨架屏') },
  );
  assert.match(html, /自定义骨架屏/);
  assert.doesNotMatch(html, /正在加载|animate-spin|成功内容/);
});

test('错误态提供回调时显示重试按钮，点击执行一次', async () => {
  const result = await render({ error: '请求错误', empty: true });
  assert.match(result.html, /加载失败/);
  assert.match(result.html, /请求错误/);
  assert.match(result.html, /<button[^>]*>再试一次<\/button>/);
  assert.doesNotMatch(result.html, /暂无内容|成功内容|正在加载/);
  assert.equal(result.retryCount(), 0);
  result.clickRetry();
  assert.equal(result.retryCount(), 1);
});

test('未提供重试回调时保留错误信息但不渲染按钮', async () => {
  const { html, clickRetry } = await render({
    error: '请求错误',
    onRetry: undefined,
  });
  assert.match(html, /加载失败/);
  assert.match(html, /请求错误/);
  assert.doesNotMatch(html, /<button|再试一次/);
  assert.equal(clickRetry, undefined);
});

test('重试按钮支持自定义文案', async () => {
  const { html } = await render({ error: '请求错误', retryLabel: '重新获取' });
  assert.match(html, /<button[^>]*>重新获取<\/button>/);
});

test('空态优先于内容，无异步状态时渲染默认插槽', async () => {
  const empty = await render({ empty: true, emptyTitle: '空列表' });
  assert.match(empty.html, /空列表/);
  assert.doesNotMatch(empty.html, /成功内容|正在加载|<button/);
  const content = await render();
  assert.match(content.html, /<article>成功内容<\/article>/);
  assert.doesNotMatch(content.html, /正在加载|加载失败|暂无内容|<button/);
});

test('error/empty 插槽完全替换默认状态，并提供错误和重试操作', async () => {
  let slotProps;
  const error = await render(
    { error: '自定义错误' },
    {
      error: (props) => {
        slotProps = props;
        return Vue.h('aside', props.error);
      },
    },
  );
  assert.match(error.html, /<aside>自定义错误<\/aside>/);
  assert.doesNotMatch(error.html, /加载失败|再试一次/);
  slotProps.retry();
  assert.equal(error.retryCount(), 1);
  const empty = await render(
    { empty: true },
    {
      empty: () => Vue.h('aside', '自定义空态'),
    },
  );
  assert.match(empty.html, /自定义空态/);
  assert.doesNotMatch(empty.html, /暂无内容/);
});
