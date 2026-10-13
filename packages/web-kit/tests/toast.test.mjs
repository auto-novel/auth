import assert from 'node:assert/strict';
import test from 'node:test';
import { HTTPError, TimeoutError } from 'ky';

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

test('Toast.promise sanitizes and prefixes details while swallowing every rejection', async (t) => {
  const request = new Request('https://example.invalid/test');
  const httpError = new HTTPError(
    new Response(null, { status: 503 }),
    request,
    {},
  );
  const throwing = () => {
    throw new Error('getter failed');
  };
  for (const [name, reason, expected] of [
    ['JSON detail', { data: '{"message":"业务错误"}' }, '保存失败：业务错误'],
    ['plain text detail', { data: ' 服务不可用 ' }, '保存失败：服务不可用'],
    ['HTML detail', { data: '<html>Bad Gateway</html>' }, '保存失败'],
    ['HTML Error message', new Error('<h1>Bad Gateway</h1>'), '保存失败'],
    [
      'long detail',
      { data: { error: '错'.repeat(201) } },
      `保存失败：${'错'.repeat(194)}…`,
    ],
    ['HTTP fallback', httpError, '保存失败：请求失败[503]'],
    [
      'timeout fallback',
      new TimeoutError(request),
      '保存失败：请求超时，请稍后再试',
    ],
    [
      'throwing data getter',
      Object.defineProperty({}, 'data', { get: throwing }),
      '保存失败',
    ],
    [
      'throwing detail getter',
      { data: Object.defineProperty({}, 'message', { get: throwing }) },
      '保存失败',
    ],
    [
      'throwing Error message getter',
      Object.defineProperty(new Error(), 'message', { get: throwing }),
      '保存失败',
    ],
    ['primitive rejection', 'boom', '保存失败'],
    ['undefined rejection', undefined, '保存失败'],
  ]) {
    await t.test(name, async (t) => {
      const { toasts } = mountProvider(t);
      const operation = Promise.withResolvers();
      const pending = Toast.promise(operation.promise, {
        loading: '正在保存',
        success: '已保存',
        error: '保存失败',
      });
      const id = toasts.value[0].id;
      operation.reject(reason);
      assert.equal(await pending, undefined);
      assert.equal(toasts.value.length, 1);
      assert.equal(toasts.value[0].id, id);
      assert.equal(toasts.value[0].status, 'error');
      assert.equal(toasts.value[0].description, expected);
    });
  }
});

test('Toast.promise treats messages.error as a normalized prefix, not a replacement', async (t) => {
  for (const [name, prefix, reason, expected] of [
    [
      'trimmed prefix',
      ' 保存失败 ',
      new Error('网络中断'),
      '保存失败：网络中断',
    ],
    ['empty prefix', '', { data: { detail: '业务详情' } }, '业务详情'],
    ['blank prefix', ' ', new Error('网络中断'), '网络中断'],
    ['HTML prefix', '<h1>保存失败</h1>', new Error('网络中断'), '网络中断'],
    ['no detail', '保存失败', {}, '保存失败'],
    ['no prefix or detail', '', undefined, '请求失败'],
    ['HTML prefix without detail', '<h1>保存失败</h1>', {}, '请求失败'],
    [
      'exact combined length',
      '保存失败',
      new Error('错'.repeat(195)),
      `保存失败：${'错'.repeat(195)}`,
    ],
    [
      'combined truncation',
      '保存失败',
      new Error('错'.repeat(196)),
      `保存失败：${'错'.repeat(194)}…`,
    ],
  ]) {
    await t.test(name, async (t) => {
      const { toasts } = mountProvider(t);
      const pending = Toast.promise(Promise.reject(reason), {
        loading: '正在保存',
        success: '已保存',
        error: prefix,
      });
      assert.equal(await pending, undefined);
      assert.equal(toasts.value.length, 1);
      assert.equal(toasts.value[0].status, 'error');
      assert.equal(toasts.value[0].description, expected);
      assert.ok(toasts.value[0].description.length <= 200);
    });
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

test('Toast.promise supports a success marker for operations returning undefined', async (t) => {
  mountProvider(t);
  assert.equal(await Toast.promise(Promise.resolve().then(() => true)), true);
  assert.equal(
    await Toast.promise(Promise.reject(new Error('失败')).then(() => true)),
    undefined,
  );
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
