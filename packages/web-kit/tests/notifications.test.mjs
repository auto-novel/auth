import assert from 'node:assert/strict';
import test from 'node:test';

import {
  activateNotifications,
  createNotifications,
  Notify,
} from '../src/notifications/index.ts';

test('keeps the newest notification first and numbers them', () => {
  const store = createNotifications();
  store.notify.success('已保存');
  store.notify.error('保存失败');

  assert.deepEqual(
    store.items.value.map((notification) => notification.message),
    ['保存失败', '已保存'],
  );
  assert.deepEqual(
    store.items.value.map((notification) => notification.type),
    ['error', 'success'],
  );
  assert.deepEqual(
    store.items.value.map((notification) => notification.id),
    [2, 1],
  );
});

test('dismiss removes a single notification and ignores unknown ids', () => {
  const store = createNotifications();
  store.notify.success('a');
  store.notify.success('b');
  const [newest, oldest] = store.items.value;

  store.dismiss(404);
  assert.equal(store.items.value.length, 2);

  store.dismiss(newest.id);
  assert.deepEqual(
    store.items.value.map((notification) => notification.message),
    ['a'],
  );

  store.dismiss(oldest.id);
  assert.equal(store.items.value.length, 0);
});

test('dismissAll clears everything', () => {
  const store = createNotifications();
  store.notify.success('a');
  store.notify.error('b');

  store.dismissAll();
  assert.deepEqual(store.items.value, []);
});

test('stores are isolated from each other', () => {
  const first = createNotifications();
  const second = createNotifications();

  first.notify.success('only first');
  second.notify.error('only second');

  assert.deepEqual(
    first.items.value.map((notification) => notification.message),
    ['only first'],
  );
  assert.deepEqual(
    second.items.value.map((notification) => notification.message),
    ['only second'],
  );
  assert.deepEqual(
    first.items.value.map((notification) => notification.id),
    [1],
  );
});

test('Notify writes to the most recently activated store', () => {
  const first = createNotifications();
  const second = createNotifications();

  activateNotifications(first);
  Notify.success('for first');
  activateNotifications(second);
  Notify.error('for second');

  assert.deepEqual(
    first.items.value.map((notification) => notification.message),
    ['for first'],
  );
  assert.deepEqual(
    second.items.value.map((notification) => notification.message),
    ['for second'],
  );
});
