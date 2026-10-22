import * as styleClasses from '../../src/ui/classes.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import * as Vue from 'vue';
import { renderToString } from 'vue/server-renderer';

import { compileComponent } from '../helpers/compile-component.mjs';
import * as variants from '../../src/ui/button/variants.ts';

const XButton = compileComponent(
  new URL('../../src/ui/button/XButton.vue', import.meta.url),
  { vue: Vue, './variants': variants, '../classes': styleClasses },
);

async function render(props) {
  return renderToString(
    Vue.createSSRApp({
      render: () => Vue.h(XButton, props, () => '操作'),
    }),
  );
}

test('Button normalizes caller classes and merges them once while forwarding attributes', async () => {
  const html = await render({
    size: 'sm',
    class: ['px-8', { 'text-lg': true, 'px-1': false }],
    disabled: true,
    'aria-label': '保存',
  });
  const classes = html.match(/class="([^"]*)"/)[1].split(/\s+/);
  assert.equal(classes.filter((name) => name === 'px-8').length, 1);
  assert.ok(classes.includes('text-lg'));
  assert.ok(classes.includes('text-[color:var(--button-on)]'));
  assert.ok(classes.includes('[--button-on:var(--color-on-primary)]'));
  assert.ok(!classes.includes('px-3'));
  assert.ok(!classes.includes('text-sm'));
  assert.match(html, /type="button"/);
  assert.match(html, /disabled/);
  assert.match(html, /aria-label="保存"/);
  assert.match(html.replace(/<!--.*?-->/g, ''), />操作<\/button>/);
});

test('Button forwards color and soft appearance without leaking them to DOM attributes', async () => {
  const html = await render({
    color: 'warning',
    variant: 'soft',
    size: 'tiny',
  });
  const classes = html.match(/class="([^"]*)"/)[1].split(/\s+/);
  for (const name of [
    '[--button-color:var(--color-warning)]',
    'text-[color:var(--button-text)]',
    'bg-[var(--button-soft)]',
    '[--button-soft:var(--color-warning-soft)]',
    'h-[22px]',
  ]) {
    assert.ok(classes.includes(name), name);
  }
  assert.ok(!classes.includes('bg-primary'));
  assert.doesNotMatch(html, /\s(?:color|variant|size)=/);
});

test('Button polymorphic rendering forwards link attributes without a button type', async () => {
  const html = await render({ as: 'a', href: '/profile', variant: 'outline' });
  assert.match(html, /^<a\b/);
  assert.match(html, /href="\/profile"/);
  assert.doesNotMatch(html, /\stype=/);
});
