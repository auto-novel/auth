import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { JSDOM } from 'jsdom';
import { compileComponent } from '../helpers/compile-component.mjs';

// 使用真实 DOM，覆盖净化与 v-html 事件代理，而非替换安全依赖。
const dom = new JSDOM('<!doctype html><html><body></body></html>');
for (const key of [
  'window',
  'document',
  'Element',
  'HTMLElement',
  'SVGElement',
]) {
  globalThis[key] = key === 'window' ? dom.window : dom.window[key];
}
const Vue = await import('vue');
const rendering = await import('../../src/ui/markdown/render.ts');
const { createMarkdown, renderMarkdown } = rendering;
after(() => dom.window.close());

function parse(source, markdown) {
  const root = document.createElement('div');
  root.innerHTML = renderMarkdown(source, markdown);
  return root;
}

test('共享扩展与标题/链接保持语义，解析策略由调用方选择', () => {
  const root = parse(
    '## 中文 标题\n\n!!剧透!!\n\n::: details 点击展开\n内容\n:::\n\n::: star 4.5\n\n[外链](https://example.com) [锚点](#中文-标题)',
  );
  // 标题锚点属于子网站自行添加的插件，共享解析器不生成 id。
  assert.equal(root.querySelector('h2').hasAttribute('id'), false);
  assert.equal(
    root.querySelector('[data-markdown-spoiler]').dataset.hide,
    'true',
  );
  assert.equal(root.querySelector('summary').textContent, '点击展开');
  assert.equal(
    root.querySelector('.markdown-star-rating').getAttribute('aria-label'),
    '评分 4.5 / 5',
  );
  assert.equal(root.querySelectorAll('.markdown-star--active').length, 4);
  assert.equal(root.querySelectorAll('.markdown-star__half--active').length, 1);
  const [external, fragment] = root.querySelectorAll('a');
  assert.equal(external.target, '_blank');
  assert.equal(external.rel, 'noopener noreferrer');
  assert.equal(fragment.target, '');

  const restricted = createMarkdown().disable(['heading', 'image']);
  assert.equal(
    parse(
      '## 标题\n\n![图](https://example.com/a.png)',
      restricted,
    ).querySelector('h2, img'),
    null,
  );
  for (const [value, rating] of [
    ['9', 5],
    ['-1', 0],
    ['NaN', 0],
    ['3.3', 3.5],
  ]) {
    assert.equal(
      parse(`::: star ${value}`)
        .querySelector('.markdown-star-rating')
        .getAttribute('aria-label'),
      `评分 ${rating} / 5`,
    );
  }
});

test('调用方可继续挂载插件，插件输出仍经过净化', () => {
  const markdown = createMarkdown();
  markdown.use((instance) => {
    instance.renderer.rules.heading_open = () =>
      '<h2 id="自定义锚点" onclick="alert(1)">';
  });
  const root = parse('## 标题', markdown);
  assert.equal(root.querySelector('h2').id, '自定义锚点');
  assert.equal(root.querySelector('h2').hasAttribute('onclick'), false);
});

test('不接受原始 HTML、危险 URL 或容器标题注入，生成 HTML 仍经过净化', () => {
  const root = parse(
    '<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))\n\n::: details <img src=x onerror=alert(1)>\n!!文字!!\n:::',
  );
  assert.equal(
    root.querySelector(
      'img, script, [onerror], [onclick], [style], a[href^="javascript:"]',
    ),
    null,
  );
  assert.equal(
    root.querySelector('summary').textContent,
    '<img src=x onerror=alert(1)>',
  );
});

test('内容组件更新源码与解析器，剧透支持点击/键盘且不劫持展开链接', async (t) => {
  const XMarkdownContent = compileComponent(
    new URL('../../src/ui/markdown/XMarkdownContent.vue', import.meta.url),
    {
      vue: Vue,
      './render': rendering,
    },
  );
  const props = Vue.reactive({ source: '!![链接](https://example.com)!!' });
  const host = document.createElement('div');
  document.body.append(host);
  const app = Vue.createApp({ render: () => Vue.h(XMarkdownContent, props) });
  app.mount(host);
  t.after(() => {
    app.unmount();
    host.remove();
  });
  const spoiler = host.querySelector('[data-markdown-spoiler]');
  const link = spoiler.querySelector('a');
  const click = new window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
  });
  // 在根节点后阻止导航，同时记录组件是否阻止了首次点击。
  let prevented;
  host.addEventListener('click', (event) => {
    prevented = event.defaultPrevented;
    event.preventDefault();
  });
  link.dispatchEvent(click);
  assert.equal(prevented, true);
  assert.equal(spoiler.dataset.hide, 'false');
  assert.equal(spoiler.getAttribute('aria-expanded'), 'true');
  link.dispatchEvent(
    new window.MouseEvent('click', { bubbles: true, cancelable: true }),
  );
  assert.equal(prevented, false);
  assert.equal(spoiler.dataset.hide, 'false');
  const key = (target, value) => {
    const event = new window.KeyboardEvent('keydown', {
      key: value,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);
    return event;
  };
  assert.equal(key(link, 'Enter').defaultPrevented, false);
  assert.equal(key(spoiler, 'Enter').defaultPrevented, true);
  assert.equal(spoiler.dataset.hide, 'true');
  assert.equal(key(spoiler, ' ').defaultPrevented, true);
  assert.equal(spoiler.dataset.hide, 'false');
  props.source = '## 新标题';
  await Vue.nextTick();
  assert.equal(host.querySelector('h2').textContent, '新标题');
  props.markdown = Vue.markRaw(createMarkdown().disable(['heading']));
  await Vue.nextTick();
  assert.equal(host.querySelector('h2'), null);
});
