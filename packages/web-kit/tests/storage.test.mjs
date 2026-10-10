import assert from 'node:assert/strict';
import test from 'node:test';

import { useLocalStorage, useSessionStorage } from '../src/storage.ts';

const THEMES = new Set(['light', 'dark']);

function themeRef(key = 'theme') {
  return useLocalStorage(key, {
    validate: (value) =>
      typeof value === 'string' && THEMES.has(value) ? value : undefined,
    fallback: () => 'light',
  });
}

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

test('useLocalStorage 解码存储值，赋值时编码落盘', (t) => {
  const area = makeArea([['theme', JSON.stringify('dark')]]);
  useWindow(t, { localStorage: area });
  const stored = themeRef();
  assert.equal(stored.value, 'dark');
  assert.equal(area.calls.reads, 1);

  stored.value = 'light';
  assert.equal(area.values.get('theme'), JSON.stringify('light'));

  // 值没变就不写盘。
  stored.value = 'light';
  assert.equal(area.calls.writes, 1);
});

test('无效存储值会删除该键并退回 fallback', (t) => {
  const area = makeArea([['theme', JSON.stringify('blue')]]);
  useWindow(t, { localStorage: area });
  const stored = themeRef();
  assert.equal(stored.value, 'light');
  assert.equal(area.values.has('theme'), false);
  assert.equal(area.calls.removes, 1);
});

test('storage 事件同步外部变更且不回写', (t) => {
  const area = makeArea([['theme', JSON.stringify('light')]]);
  const otherArea = makeArea();
  const windowEvents = new EventTarget();
  windowEvents.localStorage = area;
  useWindow(t, windowEvents);
  const stored = themeRef();

  area.values.set('theme', JSON.stringify('dark'));
  windowEvents.dispatchEvent(storageEvent(area, 'theme'));
  assert.equal(stored.value, 'dark');

  // key 为 null 表示整片存储被清空。
  area.values.delete('theme');
  windowEvents.dispatchEvent(storageEvent(area, null));
  assert.equal(stored.value, 'light');

  // 存储值损坏时同样删除该键，外部变更也不回写。
  area.values.set('theme', 'garbage');
  windowEvents.dispatchEvent(storageEvent(area, 'theme'));
  assert.equal(stored.value, 'light');
  assert.equal(area.values.has('theme'), false);
  assert.equal(area.calls.writes, 0);

  // 其他键和其他存储区域的事件不影响这个 ref。
  area.values.set('theme', 'dark');
  windowEvents.dispatchEvent(storageEvent(otherArea, 'theme'));
  windowEvents.dispatchEvent(storageEvent(area, 'other'));
  assert.equal(stored.value, 'light');
});

test('没有可用存储时只保留内存镜像', (t) => {
  useWindow(t, {
    get localStorage() {
      throw new Error('blocked');
    },
  });
  const stored = themeRef();

  assert.equal(stored.value, 'light');
  stored.value = 'dark';
  assert.equal(stored.value, 'dark');
});

test('useSessionStorage 只读写 sessionStorage', (t) => {
  const session = makeArea([['theme', JSON.stringify('dark')]]);
  const local = makeArea();
  useWindow(t, { localStorage: local, sessionStorage: session });
  const stored = useSessionStorage('theme', {
    validate: (value) => (THEMES.has(value) ? value : undefined),
    fallback: () => 'light',
  });

  assert.equal(stored.value, 'dark');
  stored.value = 'light';
  assert.equal(session.values.get('theme'), JSON.stringify('light'));
  assert.equal(local.calls.reads, 0);
  assert.equal(local.calls.writes, 0);
});
