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

// 可控的 MediaQueryList：setMatches 更新匹配结果并派发 change。
function makeMediaQueryList(initial) {
  const listeners = new Set();
  const query = {
    matches: initial,
    addEventListener(type, listener) {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'change') listeners.delete(listener);
    },
    setMatches(matches) {
      query.matches = matches;
      for (const listener of listeners) listener({ matches });
    },
  };
  return query;
}

function useBrowser(t, { storage, prefersDark = false } = {}) {
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
  const media = makeMediaQueryList(prefersDark);
  windowEvents.matchMedia = () => media;
  windowEvents.localStorage = storage;

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

  return { media, meta, root, windowEvents };
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
  const { meta, root, windowEvents } = useBrowser(t, { prefersDark: true });

  const stored = makeArea([[THEME_KEY, JSON.stringify('light')]]);
  windowEvents.localStorage = stored;
  const theme = createWebTheme();
  assert.equal(theme.theme.value, 'light');
  assert.equal(theme.preference.value, 'light');
  assert.equal(root.dataset.theme, 'light');
  assert.equal(meta.content, '#ffffff');
  assert.equal(stored.calls.writes, 0);

  const invalid = makeArea([[THEME_KEY, JSON.stringify('blue')]]);
  windowEvents.localStorage = invalid;
  const fallback = createWebTheme();
  assert.equal(fallback.preference.value, 'system');
  assert.equal(fallback.theme.value, 'dark');
  assert.equal(fallback.isDark.value, true);
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(meta.content, '#101014');
  assert.equal(invalid.values.has(THEME_KEY), false);
});

test('无存储值时默认跟随系统，系统偏好变化实时生效且不落盘', (t) => {
  const area = makeArea();
  const { media, meta, root } = useBrowser(t, {
    storage: area,
    prefersDark: false,
  });
  const theme = createWebTheme();

  assert.equal(theme.preference.value, 'system');
  assert.equal(theme.theme.value, 'light');
  assert.equal(root.dataset.theme, 'light');
  assert.equal(area.calls.writes, 0);

  media.setMatches(true);
  assert.equal(theme.theme.value, 'dark');
  assert.equal(theme.isDark.value, true);
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(meta.content, '#101014');
  assert.equal(area.values.has(THEME_KEY), false);

  media.setMatches(false);
  assert.equal(theme.theme.value, 'light');
  assert.equal(root.dataset.theme, 'light');
  assert.equal(meta.content, '#ffffff');
  assert.equal(area.calls.writes, 0);
});

test('setPreference 固定具体外观并落盘，之后系统变化不再影响', (t) => {
  const area = makeArea();
  const { media, root } = useBrowser(t, { storage: area, prefersDark: false });
  const theme = createWebTheme();

  theme.setPreference('dark');
  assert.equal(theme.preference.value, 'dark');
  assert.equal(theme.theme.value, 'dark');
  assert.equal(area.values.get(THEME_KEY), JSON.stringify('dark'));
  assert.equal(area.calls.writes, 1);

  media.setMatches(false);
  media.setMatches(true);
  assert.equal(theme.theme.value, 'dark');
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(area.calls.writes, 1);

  theme.setPreference('system');
  assert.equal(theme.preference.value, 'system');
  assert.equal(area.values.get(THEME_KEY), JSON.stringify('system'));
  assert.equal(area.calls.writes, 2);
  assert.equal(theme.theme.value, 'dark');
});

test('toggleTheme 落盘一次并切换根元素主题', (t) => {
  const area = makeArea([[THEME_KEY, JSON.stringify('light')]]);
  const { meta, root } = useBrowser(t, { storage: area });
  const theme = createWebTheme();

  theme.toggleTheme();
  assert.equal(theme.theme.value, 'dark');
  assert.equal(theme.preference.value, 'dark');
  assert.equal(theme.isDark.value, true);
  assert.equal(area.values.get(THEME_KEY), JSON.stringify('dark'));
  assert.equal(area.calls.writes, 1);
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(meta.content, '#101014');
});

test('跟随系统时 toggleTheme 写入取反后的具体偏好', (t) => {
  const area = makeArea();
  const { media } = useBrowser(t, { storage: area, prefersDark: true });
  const theme = createWebTheme();

  assert.equal(theme.preference.value, 'system');
  assert.equal(theme.theme.value, 'dark');

  theme.toggleTheme();
  assert.equal(theme.preference.value, 'light');
  assert.equal(theme.theme.value, 'light');
  assert.equal(area.values.get(THEME_KEY), JSON.stringify('light'));
  assert.equal(area.calls.writes, 1);

  // 固定后系统偏好变化不再影响当前外观。
  media.setMatches(true);
  assert.equal(theme.theme.value, 'light');
  assert.equal(area.calls.writes, 1);
});

test('其他标签页切换主题时同步且不回写', (t) => {
  const area = makeArea([[THEME_KEY, JSON.stringify('light')]]);
  const { meta, root, windowEvents } = useBrowser(t, { storage: area });
  const theme = createWebTheme();

  // 模拟另一个标签页写入并广播 storage 事件。
  area.values.set(THEME_KEY, JSON.stringify('dark'));
  windowEvents.dispatchEvent(storageEvent(area, THEME_KEY));

  assert.equal(theme.theme.value, 'dark');
  assert.equal(theme.preference.value, 'dark');
  assert.equal(theme.isDark.value, true);
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(meta.content, '#101014');
  assert.equal(area.calls.writes, 0);
});

test("其他标签页切回 'system' 时立即采用当前系统偏好", (t) => {
  const area = makeArea([[THEME_KEY, JSON.stringify('light')]]);
  const { root, windowEvents } = useBrowser(t, {
    storage: area,
    prefersDark: true,
  });
  const theme = createWebTheme();

  assert.equal(theme.theme.value, 'light');

  area.values.set(THEME_KEY, JSON.stringify('system'));
  windowEvents.dispatchEvent(storageEvent(area, THEME_KEY));

  assert.equal(theme.preference.value, 'system');
  assert.equal(theme.theme.value, 'dark');
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(area.calls.writes, 0);
});
