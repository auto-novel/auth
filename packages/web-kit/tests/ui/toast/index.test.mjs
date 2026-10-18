import assert from 'node:assert/strict';
import test from 'node:test';

import { ToastProvider, useToastManager } from 'reka-ui';
import { createRenderer, h } from 'vue';
import { Toast, toastManager } from '../../../src/ui/toast/index.ts';

// Mount the real Provider without requiring a browser or rendering ToastRoot's DOM.
function mountProvider(t) {
  const node = () => ({ children: [], parent: null });
  function remove(child) {
    if (child.parent) {
      const siblings = child.parent.children;
      siblings.splice(siblings.indexOf(child), 1);
      child.parent = null;
    }
  }
  const renderer = createRenderer({
    createElement: node,
    createText: node,
    createComment: node,
    insert(child, parent, anchor = null) {
      remove(child);
      const index = anchor
        ? parent.children.indexOf(anchor)
        : parent.children.length;
      parent.children.splice(index, 0, child);
      child.parent = parent;
    },
    remove,
    setText() {},
    setElementText() {},
    parentNode: (child) => child.parent,
    nextSibling(child) {
      const siblings = child.parent?.children ?? [];
      return siblings[siblings.indexOf(child) + 1] ?? null;
    },
    patchProp() {},
  });
  let manager;
  const app = renderer.createApp({
    render: () =>
      h(
        ToastProvider,
        { toastManager },
        {
          default: () =>
            h({
              setup() {
                manager = useToastManager();
                return () => null;
              },
            }),
        },
      ),
  });
  app.mount(node());
  t.after(() => app.unmount());
  return manager;
}

test('Toast adds managed toasts to the Provider, newest first', (t) => {
  const { toasts } = mountProvider(t);
  Toast.success('已保存');
  Toast.error('保存失败');

  assert.deepEqual(
    toasts.value.map(({ status, description, open }) => ({
      status,
      description,
      open,
    })),
    [
      { status: 'error', description: '保存失败', open: true },
      { status: 'success', description: '已保存', open: true },
    ],
  );
  assert.notEqual(toasts.value[0].id, toasts.value[1].id);
});

test('all notification methods return IDs and forward per-toast lifecycle options', (t) => {
  const { toasts } = mountProvider(t);
  const onClose = () => {};
  const onRemove = () => {};
  for (const status of ['success', 'error', 'info', 'warning']) {
    const id = Toast[status](status, { duration: 0, onClose, onRemove });
    const toast = toasts.value[0];
    assert.equal(id, toast.id);
    assert.equal(toast.status, status);
    assert.equal(toast.duration, 0);
    assert.equal(toast.onClose, onClose);
    assert.equal(toast.onRemove, onRemove);
  }
});

test('Toast.update patches a single message without changing its ID or other messages', (t) => {
  const { toasts } = mountProvider(t);
  const id = Toast.info('before', { duration: 0 });
  const other = Toast.warning('other', { duration: 8000 });
  Toast.update(id, { message: 'after', status: 'success', duration: 1500 });
  assert.equal(toasts.value.length, 2);
  assert.equal(toasts.value[0].id, other);
  assert.equal(toasts.value[0].description, 'other');
  const updated = toasts.value[1];
  assert.equal(updated.id, id);
  assert.equal(updated.description, 'after');
  assert.equal(updated.status, 'success');
  assert.equal(updated.duration, 1500);
  Toast.update(id, { duration: undefined });
  assert.equal(toasts.value[1].duration, undefined);
  assert.equal(toasts.value[1].description, 'after');
});

test('Toast.dismiss closes only the selected message and invokes onClose once', (t) => {
  const { toasts } = mountProvider(t);
  let closed = 0;
  let removed = 0;
  const id = Toast.info('selected', {
    onClose: () => closed++,
    onRemove: () => removed++,
  });
  const other = Toast.success('other');
  Toast.dismiss(id);
  Toast.dismiss(id);
  Toast.update(id, { message: 'must not reopen' });
  Toast.update('missing', { message: 'ignored' });
  Toast.dismiss('missing');
  assert.equal(closed, 1);
  assert.equal(removed, 0); // Removal belongs to ToastRoot after the exit animation.
  assert.equal(toasts.value.length, 2);
  assert.equal(toasts.value[0].id, other);
  assert.equal(toasts.value[0].open, true);
  assert.equal(toasts.value[1].open, false);
  assert.equal(toasts.value[1].description, 'selected');
});

test('adding an existing ID updates the same toast and restarts its lifecycle', (t) => {
  const { toasts } = mountProvider(t);
  const id = Toast.info('before', { id: 'custom', duration: 0 });
  assert.equal(Toast.warning('after', { id, duration: 1000 }), id);
  assert.equal(toasts.value.length, 1);
  assert.equal(toasts.value[0].status, 'warning');
  assert.equal(toasts.value[0].duration, 1000);
  Toast.dismiss(id);
  Toast.info('new lifecycle', { id });
  assert.equal(toasts.value.length, 1);
  assert.equal(toasts.value[0].open, true);
});

test('Toast.promise supports per-stage lifecycle options and resets loading duration', async (t) => {
  const { toasts } = mountProvider(t);
  const operation = Promise.withResolvers();
  const pending = Toast.promise(
    operation.promise,
    {
      loading: { message: 'loading', duration: 0 },
      success: { message: 'done', duration: 1200 },
    },
    { id: 'promise-options', duration: 7000 },
  );
  assert.equal(toasts.value[0].id, 'promise-options');
  assert.equal(toasts.value[0].duration, 0);
  operation.resolve(42);
  assert.equal(await pending, 42);
  assert.equal(toasts.value[0].duration, 1200);
  assert.equal(toasts.value[0].description, 'done');

  await Toast.promise(Promise.resolve(), {
    loading: { message: 'loading', duration: 0 },
    success: 'done',
  });
  assert.equal(toasts.value[0].duration, undefined);
});

test('Toast.promise supports configured result messages without a loading toast', async (t) => {
  const { toasts } = mountProvider(t);
  let closed = 0;
  assert.equal(
    await Toast.promise(Promise.reject(new Error('detail')), {
      error: { message: 'failed', duration: 0, onClose: () => closed++ },
    }),
    undefined,
  );
  assert.equal(toasts.value[0].description, 'failed：detail');
  assert.equal(toasts.value[0].duration, 0);
  Toast.dismiss(toasts.value[0].id);
  assert.equal(closed, 1);
});

test('Toast.dismissAll closes toasts without prematurely removing them', (t) => {
  const { toasts, close } = mountProvider(t);
  Toast.success('before');
  const oldId = toasts.value[0].id;
  Toast.dismissAll();
  assert.equal(toasts.value.length, 1);
  assert.equal(toasts.value[0].open, false);

  Toast.error('after');
  assert.notEqual(toasts.value[0].id, oldId);
  close(oldId);
  assert.equal(toasts.value[0].description, 'after');
  assert.equal(toasts.value[0].open, true);
  Toast.dismissAll();
  assert.ok(toasts.value.every((toast) => !toast.open));
});

test('Toast.promise updates the same toast and preserves its resolved value', async (t) => {
  const { toasts } = mountProvider(t);
  const operation = Promise.withResolvers();
  const result = { name: '设置' };
  const pending = Toast.promise(operation.promise, {
    loading: '正在保存',
    success: '设置已保存',
    error: '保存失败',
  });
  const id = toasts.value[0].id;
  assert.equal(toasts.value[0].status, 'loading');
  assert.equal(toasts.value[0].description, '正在保存');

  operation.resolve(result);
  assert.equal(await pending, result);
  assert.equal(toasts.value.length, 1);
  assert.equal(toasts.value[0].id, id);
  assert.equal(toasts.value[0].status, 'success');
  assert.equal(toasts.value[0].description, '设置已保存');
  assert.equal(toasts.value[0].open, true);
});

test('Toast.promise prefixes the Error message and swallows the rejection', async (t) => {
  const { toasts } = mountProvider(t);
  const operation = Promise.withResolvers();
  const error = new Error('网络不可用');
  const pending = Toast.promise(operation.promise, {
    loading: '正在保存',
    success: '已保存',
    error: '保存失败',
  });
  const id = toasts.value[0].id;
  operation.reject(error);
  assert.equal(await pending, undefined);
  assert.equal(toasts.value.length, 1);
  assert.equal(toasts.value[0].id, id);
  assert.equal(toasts.value[0].status, 'error');
  assert.equal(toasts.value[0].description, '保存失败：网络不可用');
  assert.equal(toasts.value[0].duration, undefined);
});

test('Toast.promise uses parsed details without reading the response or mutating the rejection', async (t) => {
  const { toasts } = mountProvider(t);
  let responseReads = 0;
  const error = Object.freeze(
    Object.assign(new Error('原始错误'), {
      data: Object.freeze({ detail: '用户名已存在' }),
      response: {
        text() {
          responseReads++;
          throw new Error('response must not be read');
        },
        clone() {
          responseReads++;
          throw new Error('response must not be cloned');
        },
      },
    }),
  );
  const before = Object.getOwnPropertyDescriptors(error);
  const operation = Promise.withResolvers();
  const pending = Toast.promise(operation.promise, {
    loading: '正在保存',
    success: '已保存',
    error: '保存失败',
  });
  const id = toasts.value[0].id;
  operation.reject(error);
  assert.equal(await pending, undefined);
  assert.equal(toasts.value.length, 1);
  assert.equal(toasts.value[0].id, id);
  assert.equal(toasts.value[0].status, 'error');
  assert.equal(toasts.value[0].description, '保存失败：用户名已存在');
  assert.equal(responseReads, 0);
  assert.deepEqual(Object.getOwnPropertyDescriptors(error), before);
});

test('Toast.promise 将 error 文案作为前缀，空字符串仍显示错误详情', async (t) => {
  const { toasts } = mountProvider(t);
  for (const [prefix, expected] of [
    [' 保存失败 ', '保存失败：网络中断'],
    ['', '网络中断'],
  ]) {
    const pending = Toast.promise(Promise.reject(new Error('网络中断')), {
      error: prefix,
    });
    assert.equal(await pending, undefined);
    assert.equal(toasts.value[0].status, 'error');
    assert.equal(toasts.value[0].description, expected);
  }
});

test('Toast.promise swallows errors even when messages are omitted', async (t) => {
  const { toasts } = mountProvider(t);
  assert.equal(
    await Toast.promise(Promise.reject(new Error('失败'))),
    undefined,
  );
  assert.equal(toasts.value.length, 0);
});

test('Toast.promise closes the loading toast when the error message is omitted', async (t) => {
  const { toasts } = mountProvider(t);
  const operation = Promise.withResolvers();
  const pending = Toast.promise(operation.promise, { loading: '正在保存' });
  operation.reject(new Error('失败'));
  assert.equal(await pending, undefined);
  assert.equal(toasts.value.length, 1);
  assert.equal(toasts.value[0].open, false);
});

test('a late Promise result does not reopen a dismissed toast', async (t) => {
  const { toasts } = mountProvider(t);
  const operation = Promise.withResolvers();
  const pending = Toast.promise(operation.promise, {
    loading: '正在保存',
    success: '已保存',
    error: '保存失败',
  });
  Toast.dismissAll();
  operation.resolve('done');
  assert.equal(await pending, 'done');
  assert.equal(toasts.value[0].open, false);
  assert.equal(toasts.value[0].status, 'loading');
});

test("a new Provider does not inherit a previous Provider's toast list", (t) => {
  const first = mountProvider(t);
  Toast.success('first');
  const second = mountProvider(t);
  assert.equal(second.toasts.value.length, 0);
  Toast.error('shared event');
  assert.equal(first.toasts.value[0].description, 'shared event');
  assert.equal(second.toasts.value[0].description, 'shared event');
});
