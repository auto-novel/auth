import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import test from 'node:test';

import { createAttention } from '../src/attentionContext.ts';

const attentionStatus = (hasUnread) => ({ strikes: { hasUnread } });

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function setup(t, { autoStart = true } = {}) {
  const previousDocument = globalThis.document;
  const document = new EventTarget();
  document.visibilityState = 'visible';
  globalThis.document = document;
  const addListener = t.mock.method(document, 'addEventListener');
  let interval;
  const setInterval = t.mock.method(
    globalThis,
    'setInterval',
    (callback, delay) => {
      assert.equal(delay, 60_000);
      interval = callback;
      return 1;
    },
  );
  const clearInterval = t.mock.method(globalThis, 'clearInterval', () => {});
  let listener;
  const reads = [];
  const writes = [];
  const api = {
    watchUser(callback) {
      listener = callback;
      callback(undefined);
      return () => {
        listener = undefined;
      };
    },
    getAttentionStatus() {
      const request = deferred();
      reads.push(request);
      return request.promise;
    },
    updateMyStrikeReadState(throughId) {
      const request = { ...deferred(), throughId };
      writes.push(request);
      return request.promise;
    },
  };
  const controller = createAttention(api);
  if (autoStart) controller.start();
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  return {
    ...controller,
    reads,
    writes,
    addListener,
    clearInterval,
    setInterval,
    login(id) {
      listener?.(id === undefined ? undefined : { id });
    },
    tick() {
      interval();
    },
    visible(value) {
      document.visibilityState = value ? 'visible' : 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
    },
  };
}

test('coalesces login, menu and visibility queries; preserves state on failure', async (t) => {
  const h = setup(t);
  await h.context.refresh();
  assert.equal(h.reads.length, 0);
  h.login(1);
  const first = h.context.refresh();
  assert.equal(first, h.context.refresh());
  h.visible(true);
  h.tick();
  await setImmediate();
  assert.equal(h.reads.length, 1);
  h.reads[0].resolve(attentionStatus(true));
  await first;
  h.visible(false);
  h.tick();
  await setImmediate();
  assert.equal(h.reads.length, 1);
  h.visible(true);
  const retry = h.context.refresh();
  await setImmediate();
  h.reads[1].reject(new Error('offline'));
  await retry;
  assert.equal(h.context.status.value.strikes.hasUnread, true);
});

test('queues acknowledgement behind a query and queries again after the write', async (t) => {
  const h = setup(t);
  h.login(1);
  await setImmediate();
  const update = h.context.updateStrikeReadState(10);
  assert.equal(h.writes.length, 0);
  h.reads[0].resolve(attentionStatus(true));
  await setImmediate();
  assert.equal(h.context.status.value, undefined);
  assert.equal(h.writes[0].throughId, 10);
  h.context.refresh();
  h.tick();
  assert.equal(h.reads.length, 1);
  h.writes[0].resolve({ hasUnread: false });
  await setImmediate();
  assert.equal(h.context.status.value.strikes.hasUnread, false);
  assert.equal(h.reads.length, 2);
  // A strike created after the acknowledgement must restore the reminder.
  h.reads[1].resolve(attentionStatus(true));
  await update;
  assert.equal(h.context.status.value.strikes.hasUnread, true);
});

test('serializes writes and merges pending boundaries using their maximum', async (t) => {
  const h = setup(t);
  h.login(1);
  const result = h.context.updateStrikeReadState(10);
  await setImmediate();
  assert.equal(h.reads.length, 0);
  h.context.updateStrikeReadState(30);
  h.context.updateStrikeReadState(20);
  assert.equal(h.writes.length, 1);
  h.writes[0].resolve({ hasUnread: true });
  await setImmediate();
  assert.deepEqual(
    h.writes.map((write) => write.throughId),
    [10, 30],
  );
  h.writes[1].resolve({ hasUnread: false });
  await setImmediate();
  h.reads[0].resolve(attentionStatus(false));
  await result;
  assert.equal(h.context.status.value.strikes.hasUnread, false);
});

test('retries only the viewed boundary on a later timer or visibility refresh', async (t) => {
  const h = setup(t);
  h.login(1);
  const initial = h.context.refresh();
  await setImmediate();
  h.reads[0].resolve(attentionStatus(true));
  await initial;
  const update = h.context.updateStrikeReadState(12);
  await setImmediate();
  h.writes[0].reject(new Error('offline'));
  await update;
  assert.equal(h.context.status.value.strikes.hasUnread, true);
  h.tick();
  const retry = h.context.refresh();
  await setImmediate();
  assert.equal(h.writes[1].throughId, 12);
  h.writes[1].reject(new Error('still offline'));
  await retry;
  h.visible(true);
  const recovered = h.context.refresh();
  await setImmediate();
  assert.equal(h.writes[2].throughId, 12);
  h.writes[2].resolve({ hasUnread: true });
  await setImmediate();
  h.reads[1].resolve(attentionStatus(true));
  await recovered;
  assert.equal(h.context.status.value.strikes.hasUnread, true);
});

test('account changes discard pending acknowledgements and old responses', async (t) => {
  const h = setup(t);
  h.login(1);
  const old = h.context.updateStrikeReadState(10);
  await setImmediate();
  h.context.updateStrikeReadState(20);
  h.login(2);
  const next = h.context.refresh();
  await setImmediate();
  h.reads[0].resolve(attentionStatus(true));
  await next;
  h.writes[0].resolve({ hasUnread: false });
  await old;
  assert.equal(h.writes.length, 1);
  assert.equal(h.context.status.value.strikes.hasUnread, true);
  const stale = h.context.refresh();
  await setImmediate();
  h.login(undefined);
  assert.equal(h.context.status.value, undefined);
  h.login(2);
  const relogin = h.context.refresh();
  await setImmediate();
  h.reads[2].resolve(attentionStatus(false));
  await relogin;
  h.reads[1].resolve(attentionStatus(true));
  await stale;
  assert.equal(h.context.status.value.strikes.hasUnread, false);
});

test('does nothing until start() is called', async (t) => {
  const h = setup(t, { autoStart: false });

  assert.equal(h.addListener.mock.callCount(), 0);
  assert.equal(h.setInterval.mock.callCount(), 0);
  h.login(1);
  await h.context.refresh();
  await setImmediate();
  assert.equal(h.reads.length, 0);

  h.start();
  assert.equal(h.setInterval.mock.callCount(), 0);
  assert.equal(
    h.addListener.mock.calls.some(
      (call) => call.arguments[0] === 'visibilitychange',
    ),
    true,
  );

  h.login(1);
  await setImmediate();
  assert.equal(h.reads.length, 1);
  assert.equal(h.setInterval.mock.callCount(), 1);
});

test('polls only while signed in', async (t) => {
  const h = setup(t);
  h.login(1);
  await setImmediate();
  h.reads[0].resolve(attentionStatus(true));
  await setImmediate();
  assert.equal(h.setInterval.mock.callCount(), 1);

  h.login(undefined);
  assert.equal(h.context.status.value, undefined);
  assert.equal(h.clearInterval.mock.callCount(), 1);

  const reads = h.reads.length;
  h.tick();
  h.visible(true);
  await setImmediate();
  assert.equal(h.reads.length, reads);

  h.login(2);
  assert.equal(h.setInterval.mock.callCount(), 2);
});
