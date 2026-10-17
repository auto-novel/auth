import { useDropZone, useEventListener } from '@vueuse/core';
import {
  effectScope,
  readonly,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue';

/** 只接收系统文件拖放；不读取、筛选或上传文件。 */
export function useFileDrop(
  disabled: MaybeRefOrGetter<boolean>,
  onDrop: (files: File[], event: DragEvent) => void,
  target: Document | undefined = typeof document === 'undefined'
    ? undefined
    : document,
) {
  const active = shallowRef(false);
  const internalDrag = shallowRef(false);
  const revision = shallowRef(0);
  const reset = () => revision.value++;

  // useDropZone 没有 reset：重建作用域同时清除内部计数、文件引用和监听器。
  watch(
    [() => toValue(disabled), internalDrag, revision],
    ([isDisabled, isInternal], _, onCleanup) => {
      active.value = false;
      if (!target || isDisabled || isInternal) return;
      const scope = effectScope();
      onCleanup(() => scope.stop());
      scope.run(() => {
        const { isOverDropZone, files } = useDropZone(target, {
          checkValidity: (items) =>
            Array.from(items).some((item) => item.kind === 'file'),
          onEnter: (_, event) => {
            // Safari 会跳过拖入时的有效性检查，不能仅依赖 isOverDropZone。
            active.value = Array.from(event.dataTransfer?.types ?? []).includes(
              'Files',
            );
          },
          onLeave: () => {
            if (!isOverDropZone.value) reset();
          },
          onDrop: (dropped, event) => {
            active.value = false;
            files.value = null;
            if (!toValue(disabled) && !internalDrag.value && dropped?.length)
              onDrop(dropped, event);
          },
        });
      });
    },
    { immediate: true, flush: 'sync' },
  );

  useEventListener(
    target,
    'dragstart',
    () => {
      internalDrag.value = true;
    },
    { capture: true },
  );
  useEventListener(target, 'dragend', () => {
    internalDrag.value = false;
    reset();
  });
  useEventListener(target?.defaultView ?? target, 'blur', () => {
    internalDrag.value = false;
    reset();
  });
  useEventListener(target, 'keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') reset();
  });

  return { active: readonly(active) };
}
