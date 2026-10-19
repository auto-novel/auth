import assert from 'node:assert/strict';
import test from 'node:test';
import { effectScope, nextTick, ref, shallowRef } from 'vue';
// VueUse chooses client sharing at import time. Enable that branch without a DOM;
// geometry and events below use explicit test doubles, not browser rendering.
const globals = ['window', 'document'].map((key) => [
  key,
  Object.getOwnPropertyDescriptor(globalThis, key),
]);
Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: new EventTarget(),
});
const { useDialogMotion, useDialogPointerTracking } =
  await import('../../src/ui/dialog/useDialogMotion.ts');
for (const [key, descriptor] of globals) {
  if (descriptor) Object.defineProperty(globalThis, key, descriptor);
  else delete globalThis[key];
}

function environment(t) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const doc = new EventTarget();
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: doc,
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  return {
    doc,
    send(type, props = {}) {
      doc.dispatchEvent(
        Object.assign(new Event(type), {
          button: 0,
          detail: 1,
          clientX: 100,
          clientY: 80,
          ...props,
        }),
      );
    },
  };
}

function scope(t, callback) {
  const instance = effectScope();
  t.after(() => instance.stop());
  return { instance, value: instance.run(callback) };
}

function motion(open, enabled) {
  const content = shallowRef(null);
  useDialogMotion(content, open, enabled);
  return content;
}

function panel() {
  const properties = new Map([['scale', ['0.8', 'important']]]);
  return {
    isConnected: true,
    style: {
      transformOrigin: '',
      getPropertyValue: (name) => properties.get(name)?.[0] ?? '',
      getPropertyPriority: (name) => properties.get(name)?.[1] ?? '',
      setProperty: (name, value, priority) =>
        properties.set(name, [value, priority]),
      removeProperty: (name) => properties.delete(name),
    },
    getBoundingClientRect() {
      // Measuring the scaled rect would produce an incorrect origin.
      assert.deepEqual(properties.get('scale'), ['1', 'important']);
      return { left: 300, top: 200 };
    },
  };
}

test('点击打开使用面板外鼠标原点，退出保持原点，重开更新且恢复原 scale', async (t) => {
  const { send } = environment(t);
  const open = ref(false);
  const { value: content } = scope(t, () => motion(open));
  const element = panel();
  send('click');
  open.value = true;
  content.value = { $el: element };
  await nextTick();
  assert.equal(element.style.transformOrigin, '-200px -120px');
  assert.equal(element.style.getPropertyValue('scale'), '0.8');
  assert.equal(element.style.getPropertyPriority('scale'), 'important');

  open.value = false;
  send('click', { clientX: 450, clientY: 260 });
  await nextTick();
  assert.equal(element.style.transformOrigin, '-200px -120px');
  open.value = true;
  await nextTick();
  assert.equal(element.style.transformOrigin, '150px 60px');
});

test('壳层提前捕获点击，支持条件挂载；共享监听在最后一个使用者销毁后清理', async (t) => {
  const { doc, send } = environment(t);
  const add = t.mock.method(doc, 'addEventListener');
  const remove = t.mock.method(doc, 'removeEventListener');
  const shell = scope(t, useDialogPointerTracking);
  send('click', { clientX: 0, clientY: 0 });
  const dialog = scope(t, () => motion(true));
  const element = panel();
  dialog.value.value = { $el: element };
  await nextTick();
  assert.equal(element.style.transformOrigin, '-300px -200px');
  assert.equal(add.mock.callCount(), 3);
  shell.instance.stop();
  assert.equal(remove.mock.callCount(), 0);
  dialog.instance.stop();
  assert.equal(remove.mock.callCount(), 3);
});

test('键盘、过期点击与全屏回退中心，无旧坐标泄漏', async (t) => {
  const { send } = environment(t);
  let now = 1000;
  t.mock.method(Date, 'now', () => now);
  const open = ref(false);
  const enabled = ref(true);
  const { value: content } = scope(t, () => motion(open, enabled));
  const element = panel();
  for (const type of ['keydown', 'click']) {
    send('click');
    send(type, { detail: 0 });
    open.value = true;
    content.value = { $el: element };
    await nextTick();
    assert.equal(element.style.transformOrigin, 'center');
    open.value = false;
  }
  send('click');
  now += 65;
  open.value = true;
  content.value = { $el: element };
  await nextTick();
  assert.equal(element.style.transformOrigin, 'center');

  open.value = false;
  send('click');
  enabled.value = false;
  open.value = true;
  await nextTick();
  assert.equal(element.style.transformOrigin, 'center');
  enabled.value = true;
  await nextTick();
  assert.equal(element.style.transformOrigin, '-200px -120px');
});

test('面板稍后挂载也使用打开时的坐标，无需 autofocus 事件', async (t) => {
  const { send } = environment(t);
  let now = 1000;
  t.mock.method(Date, 'now', () => now);
  const open = ref(false);
  const { value: content } = scope(t, () => motion(open));
  send('click');
  open.value = true;
  await nextTick();

  now += 100;
  send('click', { clientX: 500, clientY: 400 });
  const element = panel();
  content.value = { $el: element };
  await nextTick();
  assert.equal(element.style.transformOrigin, '-200px -120px');
});

test('SSR 无 document 时可安全创建', (t) => {
  assert.equal(scope(t, () => motion(true)).value.value, null);
});
