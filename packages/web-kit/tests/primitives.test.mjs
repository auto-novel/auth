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

test('ScrollArea renders a focusable viewport, content slot and caller dimensions', async () => {
  const ScrollArea = await component('scroll-area/XScrollArea');
  const html = await renderToString(
    h(
      ScrollArea,
      {
        orientation: 'both',
        class: 'h-48',
        viewportClass: 'p-4',
      },
      () => 'Scrollable content',
    ),
  );
  assert.match(html, /h-48/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /p-4/);
  assert.match(html, /Scrollable content/);
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
