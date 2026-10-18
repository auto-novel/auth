import { compileComponent } from '../helpers/compile-component.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import * as Vue from 'vue';
import * as Reka from 'reka-ui';
import { renderToString } from 'vue/server-renderer';
import { useOverlayLayer } from '../../src/ui/overlayLayer.ts';

const dependencies = {
  vue: Vue,
  // Keep Reka's real semantic components; only bypass Portal's SSR omission.
  'reka-ui': { ...Reka, DialogPortal: (_, { slots }) => slots.default?.() },
  '@vicons/material': { CloseOutlined: () => Vue.h('svg') },
  '../overlayLayer': { useOverlayLayer },
};
const XDialog = compileComponent(
  new URL('../../src/ui/dialog/XDialog.vue', import.meta.url),
  dependencies,
);

async function render(props = {}, slots = {}) {
  const html = await renderToString(
    Vue.createSSRApp({
      render: () => Vue.h(XDialog, { open: true, ...props }, slots),
    }),
  );
  return { html, panel: html.match(/<div\b[^>]*role="dialog"[^>]*>/)?.[0] };
}

test('title/description 插槽替代文本并关联语义，footer 位于滚动正文外', async () => {
  const { html, panel } = await render(
    { title: 'fallback-title', description: 'fallback-description' },
    {
      title: () => '自定义标题',
      description: () => '自定义说明',
      default: () => Vue.h('p', '正文'),
      footer: () => Vue.h('button', '保存'),
    },
  );
  const titleId = html.match(/<h2\b[^>]*id="([^"]+)"/)[1];
  const descriptionId = html.match(/<p\b[^>]*id="([^"]+)"/)[1];
  assert.ok(panel.includes(`aria-labelledby="${titleId}"`));
  assert.ok(panel.includes(`aria-describedby="${descriptionId}"`));
  assert.match(
    html,
    /<header[\s\S]*自定义标题[\s\S]*自定义说明[\s\S]*<\/header>/,
  );
  assert.doesNotMatch(html, /fallback-title|fallback-description/);
  assert.match(
    html,
    /class="x-dialog-body[^\"]*overflow-y-auto[^\"]*"[^>]*>[\s\S]*正文[\s\S]*<\/div><footer\b/,
  );
});

test('无标题时使用显式名称，保留外部说明关联且不创建空白正文', async () => {
  const { html, panel } = await render(
    {
      'aria-label': '图片预览',
      'aria-describedby': 'external-description',
    },
    { footer: () => Vue.h('button', '关闭') },
  );
  assert.match(panel, /aria-label="图片预览"/);
  assert.match(panel, /aria-describedby="external-description"/);
  assert.doesNotMatch(panel, /aria-labelledby/);
  assert.doesNotMatch(html, /<header|x-dialog-body/);
  assert.match(html, /<footer[^>]*\bpr-14\b/);
  const bodyOnly = await render(
    { 'aria-label': '无标题正文' },
    {
      default: () => Vue.h('p', '首行不能被关闭按钮遮住'),
    },
  );
  assert.match(bodyOnly.html, /class="x-dialog-body[^\"]*x-dialog-close-space/);
  const external = await render({
    title: '默认标题',
    'aria-labelledby': 'external-title',
  });
  assert.match(external.panel, /aria-labelledby="external-title"/);
  assert.doesNotMatch(external.panel, /aria-describedby/);
});

test('自定义滚动和全屏保持不同布局，尺寸与正文 class 透传', async () => {
  const custom = await render(
    {
      title: '自定义滚动',
      scrollable: false,
      bodyClass: 'p-0',
      class: 'w-xl',
      style: { height: '70dvh' },
    },
    {
      default: () => [
        Vue.h('div', '固定工具栏'),
        Vue.h('div', { class: 'min-h-0 overflow-auto' }, '列表'),
      ],
    },
  );
  assert.match(custom.panel, /w-xl/);
  assert.match(custom.panel, /height:70dvh/);
  assert.match(
    custom.html,
    /class="x-dialog-body min-h-0 flex-1 flex flex-col p-0"/,
  );
  assert.doesNotMatch(custom.html, /overflow-y-auto/);
  const full = await render(
    { title: '登录', fullScreen: true },
    {
      default: () => Vue.h('iframe', { title: '登录表单' }),
      footer: () => Vue.h('aside', '提示'),
    },
  );
  assert.match(full.html, /<header class="sr-only">/);
  assert.doesNotMatch(full.html, /x-dialog-panel|x-dialog-body|<footer/);
  assert.match(full.html, /<iframe[\s\S]*<aside>提示<\/aside>/);
});
