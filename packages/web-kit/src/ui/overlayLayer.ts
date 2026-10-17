import {
  computed,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue';

const documents = new WeakMap<Document, ReturnType<typeof createStack>>();

function createStack() {
  const highestContent = shallowRef(49);
  return {
    highestContent,
    next() {
      const overlay = highestContent.value + 1;
      highestContent.value = overlay + 1;
      return overlay;
    },
  };
}

function getStack() {
  if (typeof document === 'undefined') return;
  let stack = documents.get(document);
  if (!stack) {
    stack = createStack();
    documents.set(document, stack);
  }
  return stack;
}

/**
 * Reka 2.11 的 Popper wrapper 仅在挂载时采样 z-index，交互栈也不随样式重排；
 * 退出动画中交错重开的视觉层级与交互顺序不保证同步，需等待内容卸载后再打开。
 */
export function useOverlayLayer(open: MaybeRefOrGetter<boolean>) {
  const layer = shallowRef(50);
  // 关闭时保留原值，且不回收旧序号：退出动画尚未结束时打开新浮层也不会碰撞。
  watch(
    () => toValue(open),
    (isOpen) => {
      if (!isOpen) return;
      const stack = getStack();
      if (stack) layer.value = stack.next();
    },
    { immediate: true, flush: 'sync' },
  );

  return {
    overlayStyle: computed(() => ({ zIndex: layer.value })),
    contentStyle: computed(() => ({ zIndex: layer.value + 1 })),
  };
}

export function useToastLayer() {
  const stack = getStack();
  return computed(() => ({
    zIndex: Math.max(100, (stack?.highestContent.value ?? 49) + 1),
  }));
}
