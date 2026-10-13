import assert from 'node:assert/strict';
import test from 'node:test';

import { ToastProvider, useToastManager } from 'reka-ui';
import { createRenderer, h } from 'vue';
import { Toast, toastManager } from '../src/ui/toast/index.ts';

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

test('Toast.promise displays an error and preserves the rejection reason', async (t) => {
  const { toasts } = mountProvider(t);
  const operation = Promise.withResolvers();
  const error = new Error('网络不可用');
  const pending = Toast.promise(operation.promise, {
    loading: '正在保存',
    success: '已保存',
    error: '保存失败',
  });
  const id = toasts.value[0].id;
  const rejected = assert.rejects(pending, (reason) => reason === error);
  operation.reject(error);
  await rejected;
  assert.equal(toasts.value.length, 1);
  assert.equal(toasts.value[0].id, id);
  assert.equal(toasts.value[0].status, 'error');
  assert.equal(toasts.value[0].description, '保存失败');
  assert.equal(toasts.value[0].duration, undefined);
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
