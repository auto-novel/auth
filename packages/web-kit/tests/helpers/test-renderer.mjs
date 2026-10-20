import * as Vue from 'vue';

// 共享的最小 DOM 宿主：保留 Vue 原生 v-model 和 IME，并补充编辑器需要的选区能力。
export function createTestRenderer(t) {
  class Document {}
  const document = Object.assign(new Document(), {
    activeElement: null,
    defaultView: { Event, scrollY: 0 },
  });
  for (const [key, value] of Object.entries({
    Document,
    ShadowRoot: class {},
  })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, key, previous);
      else delete globalThis[key];
    });
  }

  class Node extends EventTarget {
    constructor(tag) {
      super();
      Object.assign(this, {
        tag,
        children: [],
        props: {},
        style: {},
        ownerDocument: document,
        value: '',
        selectionStart: 0,
        selectionEnd: 0,
        maxLength: -1,
        scrollHeight: 96,
      });
    }
    getRootNode() {
      return document;
    }
    focus() {
      document.activeElement = this;
    }
    blur() {
      document.activeElement = null;
    }
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    }
    setRangeText(text, start, end) {
      this.value = this.value.slice(0, start) + text + this.value.slice(end);
      this.setSelectionRange(start + text.length, start + text.length);
    }
  }

  function remove(node) {
    if (node.parent)
      node.parent.children.splice(node.parent.children.indexOf(node), 1);
    node.parent = null;
  }

  const renderer = Vue.createRenderer({
    createElement: (tag) => new Node(tag),
    createText: (text) => Object.assign(new Node('#text'), { text }),
    createComment: () => new Node('#comment'),
    setText: (node, text) => (node.text = text),
    setElementText: (node, text) => (node.text = text),
    parentNode: (node) => node.parent,
    nextSibling: (node) =>
      node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null,
    remove,
    insert(node, parent, anchor) {
      remove(node);
      const index = anchor ? parent.children.indexOf(anchor) : -1;
      parent.children.splice(
        index < 0 ? parent.children.length : index,
        0,
        node,
      );
      node.parent = parent;
    },
    patchProp(node, key, previous, value) {
      node.props[key] = value;
      const property =
        { maxlength: 'maxLength', readonly: 'readOnly' }[key] ?? key;
      if (['maxLength', 'readOnly', 'disabled'].includes(property))
        node[property] = value ?? (property === 'maxLength' ? -1 : false);
      if (/^on[A-Z]/.test(key) && !key.startsWith('onUpdate:')) {
        const type = key.slice(2).toLowerCase();
        for (const handler of [previous].flat().filter(Boolean))
          node.removeEventListener(type, handler);
        for (const handler of [value].flat().filter(Boolean))
          node.addEventListener(type, handler);
      }
    },
  });

  const container = new Node('container');
  return {
    document,
    createApp: (options) => renderer.createApp(options),
    mount(app) {
      app.mount(container);
      let mounted = true;
      const unmount = () => {
        if (!mounted) return;
        mounted = false;
        app.unmount();
      };
      t.after(unmount);
      return { root: container.children[0], container, unmount };
    },
  };
}

export function classes(node) {
  return node.props.class?.split(/\s+/) ?? [];
}

export function dispatch(node, type) {
  const event = new Event(type, { cancelable: true });
  node.dispatchEvent(event);
  return event;
}
