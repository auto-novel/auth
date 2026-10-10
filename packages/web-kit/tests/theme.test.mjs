import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.startsWith('.') &&
      !/\.[a-z]+$/i.test(specifier) &&
      /\/packages\/web-kit\/src\//.test(context.parentURL ?? '')
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const { createWebTheme } = await import('../src/theme.ts');

const THEME_KEY = 'web-kit:theme:v1';

function makeArea(initial = []) {
  const values = new Map(initial);
  const calls = { reads: 0, writes: 0, removes: 0 };
  return {
    values,
    calls,
    getItem(key) {
      calls.reads++;
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      calls.writes++;
      values.set(key, value);
    },
    removeItem(key) {
      calls.removes++;
      values.delete(key);
    },
  };
}

function useBrowser(t, { prefersDark = false } = {}) {
  const meta = { content: '' };
  const root = {
    dataset: {},
    offsetWidth: 0,
    classList: { add: () => {}, remove: () => {} },
  };
  const document = {
    documentElement: root,
    querySelector: (selector) =>
      selector === 'meta[name="theme-color"]'
        ? {
            setAttribute: (_name, value) => {
              meta.content = value;
            },
          }
        : null,
  };
  const windowEvents = new EventTarget();
  windowEvents.matchMedia = () => ({ matches: prefersDark });

  const previous = {
    document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
    window: Object.getOwnPropertyDescriptor(globalThis, 'window'),
  };
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: document,
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: windowEvents,
  });
  // 过渡用定时器在测试里保持可控，避免真实 200ms 延时。
  t.mock.method(globalThis, 'setTimeout', () => 1);
  t.mock.method(globalThis, 'clearTimeout', () => {});
  t.after(() => {
    for (const [name, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });

  return { meta, root, windowEvents };
}

function storageEvent(area, key) {
  const event = new Event('storage');
  Object.defineProperties(event, {
    storageArea: { value: area },
    key: { value: key },
  });
  return event;
}

test('主题优先用存储值，无效值退回系统偏好并删除该键', (t) => {
  const { meta, root } = useBrowser(t, { prefersDark: true });

  const stored = makeArea([[THEME_KEY, 'light']]);
  const theme = createWebTheme(THEME_KEY, stored);
  assert.equal(theme.theme.value, 'light');
  assert.equal(root.dataset.theme, 'light');
  assert.equal(meta.content, '#ffffff');
  assert.equal(stored.calls.writes, 0);

  const invalid = makeArea([[THEME_KEY, 'blue']]);
  const fallback = createWebTheme(THEME_KEY, invalid);
  assert.equal(fallback.theme.value, 'dark');
  assert.equal(fallback.isDark.value, true);
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(meta.content, '#101014');
  assert.equal(invalid.values.has(THEME_KEY), false);
});

test('toggleTheme 落盘一次并切换根元素主题', (t) => {
  const { meta, root } = useBrowser(t);
  const area = makeArea([[THEME_KEY, 'light']]);
  const theme = createWebTheme(THEME_KEY, area);

  theme.toggleTheme();
  assert.equal(theme.theme.value, 'dark');
  assert.equal(theme.isDark.value, true);
  assert.equal(area.values.get(THEME_KEY), 'dark');
  assert.equal(area.calls.writes, 1);
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(meta.content, '#101014');
});

test('其他标签页切换主题时同步且不回写', (t) => {
  const { meta, root, windowEvents } = useBrowser(t);
  const area = makeArea([[THEME_KEY, 'light']]);
  const theme = createWebTheme(THEME_KEY, area);

  // 模拟另一个标签页写入并广播 storage 事件。
  area.values.set(THEME_KEY, 'dark');
  windowEvents.dispatchEvent(storageEvent(area, THEME_KEY));

  assert.equal(theme.theme.value, 'dark');
  assert.equal(theme.isDark.value, true);
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(meta.content, '#101014');
  assert.equal(area.calls.writes, 0);
});
