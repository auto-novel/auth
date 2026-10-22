import assert from 'node:assert/strict';
import test from 'node:test';
import { nextTick } from 'vue';

import { restoreScrollPosition } from '../../src/utils/restoreScrollPosition.ts';

function mockFrames(t) {
  const callbacks = [];
  t.mock.method(globalThis, 'requestAnimationFrame', (callback) => {
    callbacks.push(callback);
    return callbacks.length;
  });
  return async () => {
    const callback = callbacks.shift();
    assert.ok(callback);
    callback(0);
    await Promise.resolve();
  };
}

// Node 没有 RAF；每个测试结束后恢复原有全局属性。
function setupFrames(t) {
  const previous = Object.getOwnPropertyDescriptor(
    globalThis,
    'requestAnimationFrame',
  );
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value: () => 0,
  });
  t.after(() => {
    if (previous)
      Object.defineProperty(globalThis, 'requestAnimationFrame', previous);
    else delete globalThis.requestAnimationFrame;
  });
  return mockFrames(t);
}

test('等待缓存页面和布局更新后原样恢复位置，禁用平滑滚动', async (t) => {
  const frame = setupFrames(t);
  const position = { top: 1234, left: 12 };
  let settled = false;
  const result = restoreScrollPosition(position, () => true);
  void result.then(() => {
    settled = true;
  });
  await nextTick();

  await frame();
  assert.equal(settled, false);
  await frame();
  assert.equal(settled, false);
  await frame();
  assert.deepEqual(await result, { top: 1234, left: 12, behavior: 'instant' });
  assert.deepEqual(position, { top: 1234, left: 12 });
});

test('等待期间发生新导航时取消旧位置恢复', async (t) => {
  const frame = setupFrames(t);
  let current = true;
  const result = restoreScrollPosition({ top: 800, left: 0 }, () => current);
  await nextTick();
  await frame();
  current = false;
  await frame();
  assert.equal(await result, false);
});
