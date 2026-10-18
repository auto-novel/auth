import {
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type ShallowRef,
} from 'vue';

/** 记录浮层打开前的焦点元素，供关闭后恢复。 */
export function useReturnFocus(
  open: MaybeRefOrGetter<boolean>,
): ShallowRef<HTMLElement | null> {
  const returnFocus = shallowRef<HTMLElement | null>(null);
  watch(
    () => toValue(open),
    (isOpen) => {
      if (!isOpen || typeof document === 'undefined') return;
      const active = document.activeElement;
      returnFocus.value =
        typeof HTMLElement !== 'undefined' && active instanceof HTMLElement
          ? active
          : null;
    },
    { immediate: true, flush: 'sync' },
  );
  return returnFocus;
}
