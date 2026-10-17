<script setup lang="ts">
import { DriveFolderUploadOutlined } from '@vicons/material';

import { useOverlayLayer } from '../overlayLayer';
import type { XDropZoneProps } from './types';
import { useFileDrop } from './useFileDrop';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<XDropZoneProps>(), { disabled: false });
const emit = defineEmits<{ drop: [files: File[], event: DragEvent] }>();
const { active } = useFileDrop(
  () => props.disabled,
  (files, event) => emit('drop', files, event),
);
const { overlayStyle } = useOverlayLayer(active);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="active"
      v-bind="$attrs"
      class="fixed inset-0 bg-black/70 p-4 text-white sm:p-10"
      :style="overlayStyle"
      role="status"
    >
      <div
        class="pointer-events-none flex size-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-white/70 p-6 text-center text-xl sm:text-2xl"
      >
        <slot name="icon">
          <DriveFolderUploadOutlined class="size-12" aria-hidden="true" />
        </slot>
        <div><slot>松开以接收文件</slot></div>
      </div>
    </div>
  </Teleport>
</template>
