import * as styleClasses from '../../src/ui/classes.ts';
import { compileComponent } from '../helpers/compile-component.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import * as Vue from 'vue';
import { renderToString } from 'vue/server-renderer';

const { createRenderer, createSSRApp, effectScope, h, nextTick, ref } = Vue;

import { useOverlayLayer, useToastLayer } from '../../src/ui/overlayLayer.ts';
import { useReturnFocus } from '../../src/ui/returnFocus.ts';

function useDocument(t, value) {
  if (arguments.length < 2) value = {};
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value,
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  });
  return (next) =>
    Object.defineProperty(globalThis, 'document', { value: next });
}

function layer(t, initial = false) {
  const scope = effectScope();
  const open = ref(initial);
  const styles = scope.run(() => useOverlayLayer(open));
  t.after(() => scope.stop());
  return { open, scope, ...styles };
}

function above(upper, lower) {
  assert.ok(upper.overlayStyle.value.zIndex > lower.contentStyle.value.zIndex);
  assert.equal(
    upper.contentStyle.value.zIndex,
    upper.overlayStyle.value.zIndex + 1,
  );
}

test('按打开而非声明顺序叠放 Drawer、Dialog 和确认框', (t) => {
  useDocument(t);
  const confirm = layer(t);
  const dialog = layer(t);
  const drawer = layer(t);
  drawer.open.value = true;
  dialog.open.value = true;
  confirm.open.value = true;
  above(dialog, drawer);
  above(confirm, dialog);
});

test('反向嵌套与重新打开同样置顶，不改变已有层级', (t) => {
  useDocument(t);
  const dialog = layer(t, true);
  const drawer = layer(t, true);
  above(drawer, dialog);
  const oldDrawer = drawer.contentStyle.value.zIndex;
  dialog.open.value = false;
  dialog.open.value = true;
  above(dialog, drawer);
  assert.equal(drawer.contentStyle.value.zIndex, oldDrawer);
});

test('关闭保持退出动画层级，新打开的浮层不复用旧序号', (t) => {
  useDocument(t);
  const drawer = layer(t, true);
  const closing = layer(t, true);
  const original = closing.contentStyle.value;
  closing.open.value = false;
  assert.deepEqual(closing.contentStyle.value, original);
  const next = layer(t, true);
  above(next, closing);
  next.open.value = false;
  const replacement = layer(t, true);
  above(replacement, next);
  above(closing, drawer);
});

test('卸载停止追踪，重新创建的实例仍高于退出中的旧层', (t) => {
  useDocument(t);
  const old = layer(t, true);
  const z = old.contentStyle.value.zIndex;
  old.scope.stop();
  old.open.value = false;
  old.open.value = true;
  assert.equal(old.contentStyle.value.zIndex, z);
  const next = layer(t, true);
  above(next, old);
});

test('通知响应后续层级变化，反复重开后也始终在最高层', (t) => {
  useDocument(t);
  const scope = effectScope();
  const toastStyle = scope.run(useToastLayer);
  t.after(() => scope.stop());
  assert.equal(toastStyle.value.zIndex, 100);
  const modal = layer(t);
  for (let i = 0; i < 100; i++) {
    modal.open.value = true;
    assert.ok(toastStyle.value.zIndex > modal.contentStyle.value.zIndex);
    modal.open.value = false;
    assert.ok(toastStyle.value.zIndex > modal.contentStyle.value.zIndex);
  }
});

test('各文档独立分配，SSR 无 document 时不分配共享状态', (t) => {
  const setDocument = useDocument(t, undefined);
  const server = layer(t, true);
  server.open.value = false;
  server.open.value = true;
  assert.equal(server.overlayStyle.value.zIndex, 50);
  setDocument({});
  const first = layer(t, true);
  const second = layer(t, true);
  above(second, first);
  setDocument({});
  const otherDocument = layer(t, true);
  assert.equal(
    otherDocument.overlayStyle.value.zIndex,
    first.overlayStyle.value.zIndex,
  );
});

const renderer = createRenderer({
  createElement: (tag) => ({ tag, children: [] }),
  createText: (text) => ({ text }),
  createComment: (text) => ({ text }),
  setText: (node, text) => (node.text = text),
  setElementText: (node, text) => (node.text = text),
  patchProp: (node, key, _previous, value) => (node[key] = value),
  insert(child, parent, anchor = null) {
    if (child.parent) {
      const index = child.parent.children.indexOf(child);
      child.parent.children.splice(index, 1);
    }
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(
      index < 0 ? parent.children.length : index,
      0,
      child,
    );
    child.parent = parent;
  },
  remove(child) {
    child.parent?.children.splice(child.parent.children.indexOf(child), 1);
    child.parent = null;
  },
  parentNode: (node) => node.parent,
  nextSibling(node) {
    return (
      node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null
    );
  },
});

test('初始展开的嵌套弹层在 mounted 后仍保持子层在上', (t) => {
  useDocument(t);
  let parent;
  let child;
  const Child = {
    setup() {
      child = useOverlayLayer(() => true);
      return () => h('div');
    },
  };
  const Parent = {
    setup() {
      parent = useOverlayLayer(() => true);
      return () => h(Child);
    },
  };
  const app = renderer.createApp(Parent);
  app.mount({ children: [] });
  t.after(() => app.unmount());
  above(child, parent);
});

test('SSR 与客户端独立执行 setup，客户端立即分配层级并追踪通知', async (t) => {
  const setDocument = useDocument(t, undefined);
  const instances = [];
  const Component = {
    setup() {
      const styles = useOverlayLayer(() => true);
      const toast = useToastLayer();
      instances.push({ ...styles, toast });
      return () => h('div');
    },
  };

  await renderToString(createSSRApp(Component));
  await renderToString(createSSRApp(Component));
  const [server, otherRequest] = instances;
  assert.equal(server.overlayStyle.value.zIndex, 50);
  assert.equal(otherRequest.overlayStyle.value.zIndex, 50);
  assert.equal(server.toast.value.zIndex, 100);

  setDocument({});
  const existing = layer(t, true);
  const app = renderer.createApp(Component);
  app.mount({ children: [] });
  t.after(() => app.unmount());
  const client = instances[2];
  above(client, existing);
  assert.notEqual(client, server);

  const next = layer(t, true);
  above(next, client);
  for (let i = 0; i < 30; i++) {
    next.open.value = false;
    next.open.value = true;
  }
  assert.equal(client.toast.value.zIndex, next.contentStyle.value.zIndex + 1);
  assert.equal(server.overlayStyle.value.zIndex, 50);
  assert.equal(server.toast.value.zIndex, 100);
});

// 使用 Reka/Transition 替身，不验证真实焦点和交互栈。
for (const kind of ['Dialog', 'Drawer']) {
  test(`${kind} 仅更新层级，不强制重建退出中的内容`, async (t) => {
    useDocument(t);
    const context = Symbol('open');
    const passThrough = (_props, { slots }) => slots.default?.();
    const Root = {
      props: ['open'],
      setup(props, { slots }) {
        Vue.provide(context, () => props.open);
        return () => h('section', slots.default?.());
      },
    };
    const contents = [];
    const Content = {
      inheritAttrs: false,
      setup(_props, { slots, attrs }) {
        const isOpen = Vue.inject(context);
        const rendered = ref(isOpen());
        Vue.watch(isOpen, (open) => {
          if (open) rendered.value = true;
        });
        contents.push({
          attrs,
          finishExit() {
            if (!isOpen()) rendered.value = false;
          },
        });
        return () =>
          rendered.value ? h('article', attrs, slots.default?.()) : null;
      },
    };
    const reka = Object.fromEntries(
      [
        'Content',
        'Description',
        'Overlay',
        'Portal',
        'Root',
        'Title',
        'Trigger',
      ].map((part) => [
        `${kind}${part}`,
        part === 'Content' ? Content : part === 'Root' ? Root : passThrough,
      ]),
    );
    const Component = compileComponent(
      new URL(
        `../../src/ui/${kind.toLowerCase()}/X${kind}.vue`,
        import.meta.url,
      ),
      {
        vue: { ...Vue, Transition: passThrough },
        'reka-ui': reka,
        '../classes': styleClasses,
        '@vicons/material': { CloseOutlined: passThrough },
        '../overlayLayer': { useOverlayLayer },
        '../returnFocus': { useReturnFocus },
      },
    );
    const children = [];
    let unmounts = 0;
    const Child = {
      setup() {
        const value = ref('initial');
        children.push(value);
        Vue.onUnmounted(() => unmounts++);
        return () => h('span', value.value);
      },
    };
    const open = ref(true);
    const app = renderer.createApp({
      setup: () => () =>
        h(Component, { open: open.value, title: 'Test' }, () => h(Child)),
    });
    app.mount({ children: [] });
    t.after(() => app.unmount());
    const contentZIndex = () =>
      Vue.normalizeStyle(contents[0].attrs.style).zIndex;
    const initialZIndex = contentZIndex();
    children[0].value = 'edited';
    await nextTick();
    open.value = false;
    await nextTick();
    assert.equal(contentZIndex(), initialZIndex);
    open.value = true;
    await nextTick();
    assert.ok(contentZIndex() > initialZIndex);
    assert.equal(contents.length, 1);
    assert.equal(children.length, 1);
    assert.equal(children[0].value, 'edited');
    assert.equal(unmounts, 0);

    open.value = false;
    await nextTick();
    contents[0].finishExit();
    await nextTick();
    assert.equal(unmounts, 1);
    open.value = true;
    await nextTick();
    assert.equal(contents.length, 1);
    assert.equal(children.length, 2);
    assert.equal(children[1].value, 'initial');
  });
}
