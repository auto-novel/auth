import assert from 'node:assert/strict';
import test from 'node:test';
import * as Vue from 'vue';
import * as Reka from 'reka-ui';
import { renderToString } from 'vue/server-renderer';
import * as classes from '../../src/ui/classes.ts';
import { buttonVariants } from '../../src/ui/button/variants.ts';
import { useOverlayLayer } from '../../src/ui/overlayLayer.ts';
import { useDialogMotion } from '../../src/ui/dialog/useDialogMotion.ts';
import { compileComponent } from '../helpers/compile-component.mjs';

const passthrough = (_, { slots }) => slots.default?.();
const icon = (_, { attrs }) => Vue.h('svg', attrs);
const dependencies = {
  vue: Vue,
  '../classes': classes,
  '../overlayLayer': { useOverlayLayer },
  './useDialogMotion': { useDialogMotion },
  '@vicons/material': {
    CheckOutlined: icon,
    ExpandMoreOutlined: icon,
    DriveFolderUploadOutlined: icon,
  },
};
function component(path, overrides = {}) {
  return compileComponent(
    new URL(`../../src/ui/${path}.vue`, import.meta.url),
    {
      ...dependencies,
      ...overrides,
    },
  );
}
function node(html, marker) {
  const tag = html.match(
    new RegExp(`<[^>]+class="[^"]*\\b${marker}\\b[^"]*"[^>]*>`),
  )?.[0];
  assert.ok(tag, `Missing styled region: ${marker}\n${html}`);
  return tag;
}
function classTokens(tag) {
  return tag.match(/class="([^"]*)"/)[1].split(/\s+/);
}
function styles(tag, included, excluded = []) {
  const tokens = classTokens(tag);
  for (const value of included)
    assert.ok(tokens.includes(value), `Missing ${value}: ${tag}`);
  for (const value of excluded)
    assert.ok(!tokens.includes(value), `Unexpected ${value}: ${tag}`);
}

test('Select maps trigger and portalled regions, with class overriding Vue-shaped ui values', async () => {
  const Select = component('select/XSelect', {
    // Select owns its closed state. Force only content mounting; retain real Reka regions.
    'reka-ui': {
      ...Reka,
      SelectPortal: passthrough,
      SelectContent: (props, { slots }) =>
        Vue.h(Reka.SelectContent, { ...props, forceMount: true }, slots),
    },
  });
  const html = await renderToString(
    Vue.h(Select, {
      modelValue: 'one',
      options: [{ value: 'one', label: 'One' }],
      'aria-label': 'Choose',
      style: { width: '240px' },
      class: ['px-7', { 'text-error': true, 'text-success': false }],
      ui: {
        trigger: ['px-5 text-primary', { 'focus-visible:ring-error': true }],
        content: 'p-4 text-error',
        viewport: ['px-2', { 'viewport-override': true }],
        item: 'pl-12 text-primary',
      },
    }),
  );
  const trigger = node(html, 'x-select-trigger');
  styles(
    trigger,
    ['px-7', 'text-error', 'text-sm', 'focus-visible:ring-error'],
    [
      'px-3',
      'px-5',
      'text-ink',
      'text-primary',
      'text-success',
      'focus-visible:ring-primary/15',
    ],
  );
  assert.match(trigger, /aria-label="Choose"/);
  assert.match(trigger, /width:240px/);
  styles(
    node(html, 'x-select-content'),
    ['p-4', 'text-error', 'floating-panel', 'floating-panel-motion'],
    ['p-1', 'text-ink'],
  );
  styles(node(html, 'x-select-viewport'), ['px-2', 'viewport-override']);
  styles(
    node(html, 'x-select-item'),
    ['pl-12', 'text-primary', 'menu-item'],
    ['pl-8'],
  );
});

test('Dropdown puts ui then class on real menu content and preserves root style/aria attrs', async () => {
  const Dropdown = component('dropdown-menu/XDropdownMenu', {
    'reka-ui': { ...Reka, DropdownMenuPortal: passthrough },
  });
  const html = await renderToString(
    Vue.h(
      Dropdown,
      {
        open: true,
        class: 'menu-override p-6 text-error',
        style: { maxHeight: '220px' },
        'aria-label': 'Actions',
        ui: { content: ['p-3 text-primary', { 'min-w-64': true }] },
      },
      {
        trigger: () => Vue.h('button', 'Open'),
        default: () => Vue.h(Reka.DropdownMenuItem, {}, () => 'Edit'),
      },
    ),
  );
  const content = node(html, 'menu-override');
  styles(
    content,
    [
      'floating-panel',
      'floating-panel-motion',
      'min-w-64',
      'p-6',
      'text-error',
    ],
    ['min-w-40', 'p-1', 'p-3', 'text-ink', 'text-primary'],
  );
  assert.match(content, /role="menu"/);
  assert.match(content, /aria-label="Actions"/);
  assert.match(content, /max-height:220px/);
  assert.match(content, /z-index:51/);
  assert.doesNotMatch(
    html.match(/<button\b[^>]*>/)[0],
    /menu-override|aria-label="Actions"|max-height/,
  );
});

test('Tooltip attaches shared motion to portalled content', async () => {
  const Tooltip = component('tooltip/XTooltip', {
    'reka-ui': {
      ...Reka,
      TooltipPortal: passthrough,
      TooltipContent: (props, { slots }) =>
        Vue.h(Reka.TooltipContent, { ...props, forceMount: true }, slots),
    },
  });
  const html = await renderToString(
    Vue.h(
      Tooltip,
      {},
      {
        trigger: () => Vue.h('button', 'Help'),
        default: () => 'Details',
      },
    ),
  );
  styles(node(html, 'floating-panel'), ['floating-panel-motion']);
});

test('ConfirmDialog maps actions and independent button overrides through real XButton variants', async () => {
  const Button = component('button/XButton', {
    './variants': { buttonVariants },
  });
  const Confirm = component('dialog/XConfirmDialog', {
    'reka-ui': { ...Reka, AlertDialogPortal: passthrough },
    '../button/XButton.vue': Button,
  });
  const html = await renderToString(
    Vue.h(Confirm, {
      open: true,
      title: 'Delete item',
      description: 'This cannot be undone.',
      danger: true,
      ui: {
        actions: 'confirm-actions mt-2 justify-start gap-1',
        cancel: [
          'cancel-override px-8 text-error',
          { 'hover:text-error': true },
        ],
        confirm: 'confirm-override bg-primary px-10 hover:bg-primary-hover',
      },
    }),
  );
  styles(
    node(html, 'confirm-actions'),
    ['mt-2', 'justify-start', 'gap-1', 'flex'],
    ['mt-6', 'justify-end', 'gap-3'],
  );
  styles(
    node(html, 'cancel-override'),
    ['px-8', 'text-error', 'hover:text-error', 'border'],
    ['px-4', 'text-muted', 'hover:text-primary', 'px-10'],
  );
  styles(
    node(html, 'confirm-override'),
    [
      'bg-primary',
      'px-10',
      'hover:bg-primary-hover',
      'text-[color:var(--button-on)]',
      '[--button-on:var(--color-on-error)]',
    ],
    [
      'bg-[var(--button-color)]',
      'px-4',
      'hover:bg-[var(--button-hover)]',
      'px-8',
    ],
  );
  styles(node(html, 'x-dialog-panel-motion'), ['x-dialog-panel-motion']);
  styles(node(html, 'x-dialog-fade-motion'), ['x-dialog-fade-motion']);
  assert.match(html, /role="alertdialog"/);
});

test('active DropZone maps overlay/content/icon/description and keeps class last', async () => {
  const DropZone = component('drop-zone/XDropZone', {
    // Bypass only Teleport and the browser drag state so the actual active SFC renders in SSR.
    vue: { ...Vue, Teleport: Vue.Fragment },
    './useFileDrop': { useFileDrop: () => ({ active: Vue.ref(true) }) },
  });
  const html = await renderToString(
    Vue.h(DropZone, {
      class: ['drop-overlay p-8', { 'bg-error': true }],
      style: { opacity: 0.8 },
      'aria-label': 'Upload files',
      ui: {
        overlay: 'p-2 bg-primary sm:p-6',
        content: 'drop-content p-3 border-primary text-base',
        icon: 'drop-icon size-6',
        description: ['drop-description', { 'font-semibold': true }],
      },
    }),
  );
  const overlay = node(html, 'drop-overlay');
  styles(
    overlay,
    ['p-8', 'bg-error', 'sm:p-6'],
    ['p-4', 'p-2', 'bg-black/70', 'bg-primary', 'sm:p-10'],
  );
  assert.match(overlay, /role="status"/);
  assert.match(overlay, /aria-label="Upload files"/);
  assert.match(overlay, /opacity:0.8/);
  assert.match(overlay, /z-index:50/);
  styles(
    node(html, 'drop-content'),
    ['p-3', 'border-primary', 'text-base', 'sm:text-2xl'],
    ['p-6', 'border-white/70', 'text-xl'],
  );
  styles(node(html, 'drop-icon'), ['size-6'], ['size-12']);
  styles(node(html, 'drop-description'), ['font-semibold']);
  assert.match(html, /松开以接收文件/);
});
