import { createSharedComposable, useEventListener } from '@vueuse/core';
import { toValue, watch, type ShallowRef, type MaybeRefOrGetter } from 'vue';

type Point = { x: number; y: number; time: number };
/** Shared by the app shell and dialogs, with scope cleanup handled by VueUse. */
export const useDialogPointerTracking = createSharedComposable(() => {
  let point: Point | undefined;
  if (typeof document === 'undefined' || !document.addEventListener)
    return () => point;
  const clear = () => {
    point = undefined;
  };
  const record = (event: MouseEvent) => {
    if (event.button !== 0 || (event.type === 'click' && event.detail === 0)) {
      clear();
      return;
    }
    point = { x: event.clientX, y: event.clientY, time: Date.now() };
  };
  // Capture before trigger handlers update open, including stopPropagation cases.
  useEventListener(document, ['pointerdown', 'click'], record, {
    capture: true,
  });
  useEventListener(document, 'keydown', clear, { capture: true });
  return () => (point && Date.now() - point.time <= 64 ? point : undefined);
});

/** Preserve the opening point for the entire enter/leave cycle. */
export function useDialogMotion(
  content: Readonly<ShallowRef<{ $el: HTMLElement } | null>>,
  open: MaybeRefOrGetter<boolean>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const readPoint = useDialogPointerTracking();
  let point: Point | undefined;

  watch(
    () => toValue(open),
    (isOpen) => {
      if (isOpen) point = readPoint();
    },
    { immediate: true, flush: 'sync' },
  );

  function synchronize() {
    const panel = content.value?.$el;
    if (!panel?.isConnected || !toValue(open)) return;
    if (!point || !toValue(enabled)) {
      panel.style.transformOrigin = 'center';
      return;
    }
    // getBoundingClientRect includes the running scale animation. Measure at
    // scale 1 synchronously, then restore before paint without restarting it.
    const scale = panel.style.getPropertyValue('scale');
    const priority = panel.style.getPropertyPriority('scale');
    panel.style.setProperty('scale', '1', 'important');
    const rect = panel.getBoundingClientRect();
    if (scale) panel.style.setProperty('scale', scale, priority);
    else panel.style.removeProperty('scale');
    panel.style.transformOrigin = `${point.x - rect.left}px ${point.y - rect.top}px`;
  }

  // Track the portalled element directly: autofocus can be skipped when a
  // child already has focus. Also handles reopening during the leave animation.
  watch(
    [() => toValue(open), () => toValue(enabled), () => content.value?.$el],
    synchronize,
    { flush: 'post' },
  );
}
