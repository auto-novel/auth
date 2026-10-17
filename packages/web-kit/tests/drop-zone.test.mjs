import assert from 'node:assert/strict';
import test from 'node:test';
import { effectScope, nextTick, ref } from 'vue';

// VueUse 在导入时判断浏览器环境；用原生 EventTarget 测试真实监听逻辑。
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const previousDocument = Object.getOwnPropertyDescriptor(
  globalThis,
  'document',
);
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: new EventTarget(),
});
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: new EventTarget(),
});
const { useFileDrop } = await import('../src/ui/drop-zone/useFileDrop.ts');
test.after(() => {
  if (previousWindow)
    Object.defineProperty(globalThis, 'window', previousWindow);
  else delete globalThis.window;
  if (previousDocument)
    Object.defineProperty(globalThis, 'document', previousDocument);
  else delete globalThis.document;
});

async function setup(t) {
  const target = new EventTarget();
  const disabled = ref(false);
  const received = [];
  const scope = effectScope();
  const { active } = scope.run(() =>
    useFileDrop(disabled, (...args) => received.push(args), target),
  );
  t.after(() => scope.stop());
  await nextTick();

  function dispatch(type, { types = ['Files'], files = [], ...extra } = {}) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, {
      dataTransfer: {
        types,
        files,
        items: types.includes('Files')
          ? [{ kind: 'file', type: '' }]
          : [{ kind: 'string', type: types[0] ?? '' }],
        dropEffect: 'none',
      },
      ...extra,
    });
    target.dispatchEvent(event);
    return event;
  }
  return { active, disabled, received, dispatch, scope };
}

test('系统文件拖入显示遮罩，嵌套元素切换不闪烁，离开窗口关闭', async (t) => {
  const { active, dispatch } = await setup(t);
  assert.equal(active.value, false);
  assert.equal(dispatch('dragenter').defaultPrevented, true);
  assert.equal(active.value, true);
  dispatch('dragenter');
  dispatch('dragleave');
  assert.equal(active.value, true);
  dispatch('dragleave');
  assert.equal(active.value, false);
  dispatch('dragleave');
  await nextTick();
  dispatch('dragenter');
  assert.equal(active.value, true);
  const over = dispatch('dragover');
  assert.equal(over.defaultPrevented, true);
  assert.equal(over.dataTransfer.dropEffect, 'copy');
});

test('放下文件只交出原始文件和事件，关闭遮罩，空列表不触发', async (t) => {
  const { active, received, dispatch } = await setup(t);
  const files = [new File(['one'], 'one.txt'), new File(['two'], 'two.txt')];
  dispatch('dragenter');
  const event = dispatch('drop', { files });
  assert.equal(event.defaultPrevented, true);
  assert.equal(active.value, false);
  assert.equal(received.length, 1);
  assert.deepEqual(received[0][0], files);
  assert.equal(received[0][0][0], files[0]);
  assert.equal(received[0][1], event);
  dispatch('drop');
  assert.equal(received.length, 1);
});

test('不拦截文本、链接或页面内发起的文件拖拽', async (t) => {
  const { active, received, dispatch } = await setup(t);
  for (const types of [[], ['text/plain'], ['text/uri-list']]) {
    for (const type of ['dragenter', 'dragover', 'drop']) {
      assert.equal(dispatch(type, { types }).defaultPrevented, false);
      assert.equal(active.value, false);
    }
  }
  dispatch('dragstart');
  assert.equal(dispatch('dragenter').defaultPrevented, false);
  assert.equal(dispatch('dragover').defaultPrevented, false);
  dispatch('drop', { files: [new File([], 'internal.txt')] });
  assert.equal(received.length, 0);
  dispatch('dragend');
  await nextTick();
  dispatch('dragenter');
  assert.equal(active.value, true);
});

test('Safari 跳过有效性检查时，文本仍不显示遮罩或交出文件', async (t) => {
  const previous = Object.getOwnPropertyDescriptor(navigator, 'userAgent');
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value: 'Version/18.0 Safari/605.1.15',
  });
  t.after(() => {
    if (previous) Object.defineProperty(navigator, 'userAgent', previous);
    else delete navigator.userAgent;
  });
  const { active, received, dispatch } = await setup(t);
  dispatch('dragenter', { types: ['text/plain'] });
  assert.equal(active.value, false);
  dispatch('drop', { types: ['text/plain'] });
  assert.equal(received.length, 0);
});

test('禁用立即关闭，不拦截事件；启用后正常接收', async (t) => {
  const { active, disabled, received, dispatch } = await setup(t);
  dispatch('dragenter');
  disabled.value = true;
  assert.equal(active.value, false);
  for (const type of ['dragenter', 'dragover', 'drop']) {
    assert.equal(dispatch(type).defaultPrevented, false);
  }
  assert.equal(received.length, 0);
  disabled.value = false;
  await nextTick();
  dispatch('dragenter');
  assert.equal(active.value, true);
});

test('Escape、失焦、拖拽结束关闭，卸载清理所有监听', async (t) => {
  const { active, received, dispatch, scope } = await setup(t);
  for (const [type, extra] of [
    ['keydown', { key: 'Escape' }],
    ['blur', {}],
    ['dragend', {}],
  ]) {
    dispatch('dragenter');
    assert.equal(active.value, true);
    dispatch(type, extra);
    assert.equal(active.value, false);
    await nextTick();
  }
  scope.stop();
  assert.equal(dispatch('dragenter').defaultPrevented, false);
  assert.equal(active.value, false);
  assert.equal(
    dispatch('drop', { files: [new File([], 'file.txt')] }).defaultPrevented,
    false,
  );
  assert.equal(received.length, 0);
});

test('无浏览器文档时可安全创建（SSR）', () => {
  const document = globalThis.document;
  delete globalThis.document;
  const scope = effectScope();
  try {
    const { active } = scope.run(() => useFileDrop(false, () => {}, undefined));
    assert.equal(active.value, false);
  } finally {
    scope.stop();
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: document,
    });
  }
});
