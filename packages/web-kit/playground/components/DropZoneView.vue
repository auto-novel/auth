<script setup lang="ts">
import { XDropZone } from '@novelia/web-kit';
import { ref, shallowRef } from 'vue';
import ComponentPage from './ComponentPage.vue';

const disabled = ref(false);
const files = shallowRef<File[]>([]);
const code = `<script setup lang="ts">
import { XDropZone } from '@novelia/web-kit';

function handleDrop(files: File[]) {
  // 校验、读取、上传或保存由调用方自行实现。
}
<\/script>

<template>
  <XDropZone @drop="handleDrop">松开以导入文件</XDropZone>
</template>`;
</script>

<template>
  <ComponentPage
    title="文件拖放 · XDropZone"
    description="从系统拖入文件时显示全屏遮罩，只交出原始文件，不绑定上传行为。"
    :code="code"
  >
    <XDropZone :disabled="disabled" @drop="files = $event">
      松开以接收文件（不会上传）
    </XDropZone>
    <section class="space-y-4">
      <label class="flex items-center gap-2 text-sm">
        <input v-model="disabled" type="checkbox" />
        禁用文件拖放
      </label>
      <p class="text-sm leading-6 text-muted">
        将系统文件拖到窗口任意位置试试。普通文本、链接和页面内拖拽不会触发遮罩；拖离窗口、按
        Escape 或窗口失焦时关闭。
        禁用后恢复浏览器默认拖放行为。此示例仅显示最近一次收到的文件信息。
      </p>
      <ul v-if="files.length" class="space-y-2 text-sm">
        <li v-for="(file, index) in files" :key="index" class="break-all">
          {{ file.name }} · {{ file.size }} 字节
        </li>
      </ul>
      <p v-else class="text-sm text-muted">尚未收到文件。</p>
    </section>
  </ComponentPage>
</template>
