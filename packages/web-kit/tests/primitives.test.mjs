import assert from 'node:assert/strict';
import { after, test } from 'node:test';

import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';

// Compile the actual SFCs so props, slots and Reka accessibility semantics are tested.
const server = await createServer({
  configFile: false,
  root: new URL('..', import.meta.url).pathname,
  plugins: [vue()],
  server: { middlewareMode: true, watch: null, ws: false },
  appType: 'custom',
});
after(() => server.close());

async function component(path) {
  return (await server.ssrLoadModule(`/src/ui/${path}.vue`)).default;
}

test('Time merges caller classes without changing its native time element or empty-value behavior', async () => {
  const Time = await component('time/XTime');
  const html = await renderToString(
    h(Time, {
      time: '2025-01-01T12:00:00Z',
      class: ['text-sm', { 'text-lg': true }],
      style: { opacity: 0.8 },
      'aria-label': 'Published at',
    }),
  );
  assert.match(html, /^<time\b/);
  assert.match(html, /class="text-lg"/);
  assert.match(html, /datetime="2025-01-01T/);
  assert.match(html, /opacity:0.8/);
  assert.match(html, /aria-label="Published at"/);
  assert.doesNotMatch(await renderToString(h(Time, { time: null })), /<time\b/);
});

test('Separator defaults to decorative and supports semantic vertical separators', async () => {
  const Separator = await component('separator/XSeparator');
  const decorative = await renderToString(h(Separator));
  assert.match(decorative, /role="none"/);
  const semantic = await renderToString(
    h(Separator, { orientation: 'vertical', decorative: false }),
  );
  assert.match(semantic, /role="separator"/);
  assert.match(semantic, /aria-orientation="vertical"/);
});

test('Tabs default value selects the panel and preserves disabled tab semantics', async () => {
  const [Tabs, List, Trigger, Content] = await Promise.all(
    ['XTabs', 'XTabsList', 'XTabsTrigger', 'XTabsContent'].map((name) =>
      component(`tabs/${name}`),
    ),
  );
  const html = await renderToString(
    h(
      Tabs,
      {
        defaultValue: 'second',
        orientation: 'vertical',
        activationMode: 'manual',
      },
      {
        default: () => [
          h(
            List,
            { 'aria-label': 'Settings' },
            {
              default: () => [
                h(Trigger, { value: 'first', disabled: true }, () => 'First'),
                h(Trigger, { value: 'second' }, () => 'Second'),
              ],
            },
          ),
          h(
            Content,
            { value: 'first', forceMount: true },
            () => 'Preserved panel',
          ),
          h(Content, { value: 'second' }, () => 'Selected panel'),
        ],
      },
    ),
  );
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-orientation="vertical"/);
  assert.match(html, /aria-selected="false"[^>]*disabled/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /data-state="inactive"[^>]*hidden/);
  assert.match(html, /Preserved panel/);
  assert.match(html, /Selected panel/);
});

test('Switch merges root ui before class and exposes independent thumb styles', async () => {
  const Switch = await component('switch/XSwitch');
  const html = await renderToString(
    h(Switch, {
      modelValue: true,
      class: ['w-14', { 'bg-error': true }],
      style: { marginTop: '3px' },
      'aria-label': 'Enable alerts',
      ui: { root: 'w-12 bg-primary', thumb: ['size-5', { 'bg-paper': true }] },
    }),
  );
  const root = html.match(/<button\b[^>]*>/)[0];
  const rootClasses = root.match(/class="([^"]*)"/)[1].split(/\s+/);
  assert.ok(rootClasses.includes('w-14'));
  assert.ok(rootClasses.includes('bg-error'));
  for (const old of ['w-10', 'w-12', 'bg-border', 'bg-primary']) {
    assert.ok(!rootClasses.includes(old), old);
  }
  assert.match(root, /role="switch"/);
  assert.match(root, /aria-checked="true"/);
  assert.match(root, /aria-label="Enable alerts"/);
  assert.match(root, /margin-top:3px/);
  const thumb = html.match(/<span\b[^>]*>/)[0];
  assert.match(thumb, /size-5/);
  assert.match(thumb, /bg-paper/);
  assert.doesNotMatch(thumb, /size-4|bg-white/);
});

test('ScrollArea renders a focusable viewport, content slot and caller dimensions', async () => {
  const ScrollArea = await component('scroll-area/XScrollArea');
  const html = await renderToString(
    h(
      ScrollArea,
      {
        orientation: 'both',
        class: 'h-48',
        ui: { viewport: 'p-4' },
      },
      () => 'Scrollable content',
    ),
  );
  assert.match(html, /h-48/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /p-4/);
  assert.match(html, /Scrollable content/);
});

test('Pagination maps navigation and page regions without leaking ui to the DOM', async () => {
  const Pagination = await component('pagination/XPagination');
  const html = await renderToString(
    h(Pagination, {
      page: 2,
      totalPages: 5,
      class: 'pager-root px-8',
      'aria-label': 'Search results pages',
      ui: {
        root: 'px-2',
        list: 'pager-list gap-3',
        prev: 'pager-prev px-10',
        next: 'pager-next px-12',
        item: 'pager-item text-base',
        summary: 'pager-summary text-lg',
      },
    }),
  );
  const region = (marker) =>
    html.match(new RegExp(`<[^>]+class="[^"]*${marker}[^>]*>`))[0];
  assert.match(region('pager-root'), /px-8/);
  assert.match(region('pager-root'), /aria-label="Search results pages"/);
  assert.doesNotMatch(region('pager-root'), /(?:^|\s)px-[24](?:\s|")|\sui=/);
  assert.match(region('pager-list'), /gap-3/);
  assert.doesNotMatch(region('pager-list'), /gap-1/);
  assert.match(region('pager-prev'), /px-10/);
  assert.match(region('pager-next'), /px-12/);
  assert.match(region('pager-item'), /text-base/);
  assert.doesNotMatch(region('pager-item'), /text-xs/);
  assert.match(region('pager-summary'), /text-lg/);
});

test('DropdownMenu preserves custom trigger and disabled accessibility state', async () => {
  const DropdownMenu = await component('dropdown-menu/XDropdownMenu');
  const html = await renderToString(
    h(
      DropdownMenu,
      { disabled: true },
      {
        trigger: () => h('button', { 'aria-label': 'Actions' }, 'Open menu'),
      },
    ),
  );
  assert.match(html, /aria-haspopup="menu"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /disabled/);
  assert.match(html, /aria-label="Actions"/);
  assert.match(html, /Open menu/);
});
