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

const { useSidebarPreference } = await import('../src/sidebar.ts');

const SIDEBAR_KEY = 'web-kit:sidebar:v1';

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

function useWindow(t, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value,
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete globalThis.window;
  });
}

function storageEvent(area, key) {
  const event = new Event('storage');
  Object.defineProperties(event, {
    storageArea: { value: area },
    key: { value: key },
  });
  return event;
}

test('没存过折叠偏好时默认展开，也不主动落盘', (t) => {
  const area = makeArea();
  useWindow(t, { localStorage: area });
  const collapsed = useSidebarPreference();

  assert.equal(collapsed.value, false);
  assert.equal(area.calls.writes, 0);
  assert.equal(area.values.has(SIDEBAR_KEY), false);
});

test('恢复存储中的折叠偏好，损坏值删除后回到默认展开', (t) => {
  const collapsedArea = makeArea([[SIDEBAR_KEY, JSON.stringify(true)]]);
  useWindow(t, { localStorage: collapsedArea });
  assert.equal(useSidebarPreference().value, true);

  const brokenArea = makeArea([[SIDEBAR_KEY, 'garbage']]);
  useWindow(t, { localStorage: brokenArea });
  assert.equal(useSidebarPreference().value, false);
  assert.equal(brokenArea.values.has(SIDEBAR_KEY), false);
  assert.equal(brokenArea.calls.removes, 1);

  const wrongArea = makeArea([[SIDEBAR_KEY, JSON.stringify('collapsed')]]);
  useWindow(t, { localStorage: wrongArea });
  assert.equal(useSidebarPreference().value, false);
  assert.equal(wrongArea.values.has(SIDEBAR_KEY), false);
});

test('切换折叠落盘一次，跨标签同步且不回写', (t) => {
  const area = makeArea([[SIDEBAR_KEY, JSON.stringify(false)]]);
  const windowEvents = new EventTarget();
  windowEvents.localStorage = area;
  useWindow(t, windowEvents);
  const collapsed = useSidebarPreference();

  collapsed.value = true;
  assert.equal(area.values.get(SIDEBAR_KEY), JSON.stringify(true));
  assert.equal(area.calls.writes, 1);

  // 值没变就不重复写盘。
  collapsed.value = true;
  assert.equal(area.calls.writes, 1);

  area.values.set(SIDEBAR_KEY, JSON.stringify(false));
  windowEvents.dispatchEvent(storageEvent(area, SIDEBAR_KEY));
  assert.equal(collapsed.value, false);
  assert.equal(area.calls.writes, 1);

  // 整片存储被清空时回到默认展开。
  area.values.delete(SIDEBAR_KEY);
  windowEvents.dispatchEvent(storageEvent(area, null));
  assert.equal(collapsed.value, false);
});
