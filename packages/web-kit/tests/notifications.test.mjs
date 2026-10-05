import assert from 'node:assert/strict';
import test from 'node:test';

import { notifications, Notify } from '../src/notifications/index.ts';

function reset(t) {
  Notify.dismissAll();
  t.after(() => Notify.dismissAll());
}

test('Notify writes directly to the single queue, newest first', (t) => {
  reset(t);
  Notify.success('已保存');
  Notify.error('保存失败');

  assert.deepEqual(
    notifications.items.value.map(({ type, message }) => ({ type, message })),
    [
      { type: 'error', message: '保存失败' },
      { type: 'success', message: '已保存' },
    ],
  );
  const [newest, oldest] = notifications.items.value;
  assert.equal(newest.id, oldest.id + 1);
});

test('internal dismiss removes one notification and ignores unknown ids', (t) => {
  reset(t);
  Notify.success('a');
  Notify.success('b');
  const [newest, oldest] = notifications.items.value;

  notifications.dismiss(-1);
  assert.equal(notifications.items.value.length, 2);
  notifications.dismiss(newest.id);
  assert.deepEqual(
    notifications.items.value.map(({ message }) => message),
    ['a'],
  );
  notifications.dismiss(oldest.id);
  assert.deepEqual(notifications.items.value, []);
});

test('Notify.dismissAll clears the same queue without reusing message ids', (t) => {
  reset(t);
  Notify.success('before');
  const oldId = notifications.items.value[0].id;
  Notify.dismissAll();
  assert.deepEqual(notifications.items.value, []);

  Notify.error('after');
  assert.ok(notifications.items.value[0].id > oldId);
  // A late close event from an old toast must not dismiss the new one.
  notifications.dismiss(oldId);
  assert.equal(notifications.items.value[0].message, 'after');
});

test('the rendering queue is deeply readonly', (t) => {
  reset(t);
  Notify.success('original');
  const warnings = t.mock.method(console, 'warn', () => {});
  notifications.items.value[0].message = 'changed';
  notifications.items.value.push({
    id: -1,
    type: 'error',
    message: 'injected',
  });
  assert.equal(notifications.items.value.length, 1);
  assert.equal(notifications.items.value[0].message, 'original');
  assert.ok(warnings.mock.callCount() > 0);
});
