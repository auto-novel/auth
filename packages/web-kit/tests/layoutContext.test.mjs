import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from 'vue';

import { layoutKey, useWebKitLayout } from '../src/layoutContext.ts';

function appWithContext() {
  return createApp({ render: () => null });
}

test('uses the scroll target provided by WebKitLayout', () => {
  const app = appWithContext();
  const calls = [];
  app.provide(layoutKey, {
    scrollToTop: (options) => calls.push(options),
  });

  app
    .runWithContext(() => useWebKitLayout())
    .scrollToTop({
      behavior: 'smooth',
    });

  assert.deepEqual(calls, [{ behavior: 'smooth' }]);
});

test('falls back to the window without a layout', (t) => {
  const previousWindow = globalThis.window;
  const calls = [];
  globalThis.window = {
    scrollTo: (options) => calls.push(options),
  };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });

  const layout = appWithContext().runWithContext(() => useWebKitLayout());
  layout.scrollToTop();
  layout.scrollToTop({ behavior: 'smooth' });

  assert.deepEqual(calls, [{ top: 0 }, { top: 0, behavior: 'smooth' }]);
});
