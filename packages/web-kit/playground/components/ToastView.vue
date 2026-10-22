<script setup lang="ts">
import { Toast, XButton, type ToastId } from '@novelia/web-kit';
import { onBeforeUnmount, ref } from 'vue';
import ComponentPage from './ComponentPage.vue';

const ownedIds = new Set<ToastId>();
const editableId = ref<ToastId>();
const logs = ref<{ key: number; time: string; message: string }[]>([]);
const pending = ref(false);
const result = ref('尚未执行');
let logKey = 0;
let sequence = 0;
let finishOperation: ((fail: boolean) => void) | undefined;

function track(id: ToastId) {
  ownedIds.add(id);
  return id;
}

function log(message: string) {
  logs.value.unshift({
    key: ++logKey,
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    message,
  });
  logs.value = logs.value.slice(0, 12);
}

function showEditable() {
  if (editableId.value) {
    Toast.info('重复使用同一 ID：更新原消息，不新增通知。', {
      id: editableId.value,
      duration: 0,
    });
    log('同 ID 更新 · 保持常驻');
    return;
  }
  const id = track(
    Toast.info('常驻通知：尝试更新、关闭或向上拖动。', {
      duration: 0,
      onClose: () => {
        if (editableId.value === id) editableId.value = undefined;
        log('onClose · 已关闭，开始退场');
      },
      onRemove: () => {
        ownedIds.delete(id);
        log('onRemove · 退场结束，移出列表');
      },
    }),
  );
  editableId.value = id;
  log(`创建常驻通知 · ${id}`);
}

function updateEditable() {
  if (!editableId.value) return;
  Toast.update(editableId.value, {
    message: '更新成功，3 秒后自动关闭。',
    status: 'success',
    duration: 3000,
  });
  log('Toast.update · success · 3000ms');
}

function startOperation() {
  if (pending.value) return;
  pending.value = true;
  result.value = '等待手动完成模拟请求…';
  const operation = new Promise<string>((resolve, reject) => {
    finishOperation = (fail) => {
      finishOperation = undefined;
      if (fail) reject(new Error('网络连接中断，请稍后重试'));
      else resolve('设置已保存');
    };
  });
  const id = `playground-promise-${Date.now()}-${++sequence}`;
  track(id);
  void Toast.promise(
    operation,
    {
      loading: '正在保存…可点击页面按钮模拟结果',
      success: { message: '设置已保存', duration: 2000 },
      error: { message: '保存失败', duration: 6000 },
    },
    { id },
  ).then((value) => {
    pending.value = false;
    result.value =
      value === undefined
        ? '返回 undefined（拒绝已被处理）'
        : `返回值：${value}`;
  });
}

function showStack() {
  track(Toast.info('第一条：开始同步', { duration: 6000 }));
  track(Toast.warning('第二条：有待检查的配置', { duration: 6000 }));
  track(Toast.success('第三条：最新通知显示在最上方', { duration: 6000 }));
}

onBeforeUnmount(() => {
  for (const id of ownedIds) Toast.dismiss(id);
  finishOperation?.(false);
});

const api = [
  {
    name: 'success / error / info / warning(message, options?)',
    description: '创建对应类型的通知，返回 ToastId。',
  },
  {
    name: 'update(id, options)',
    description:
      '更新内容、状态或时长；只更新仍打开的消息，不会重新打开已关闭的通知。',
  },
  {
    name: 'dismiss(id) / dismissAll()',
    description:
      '关闭单条 / 全部通知；保留退场动画。dismissAll 会影响整个应用的通知。',
  },
  {
    name: 'promise(promise, messages?, options?)',
    description:
      '同一条消息从 loading 更新为结果。成功返回原值，失败返回 undefined，不再向外抛出拒绝。',
  },
];
const options = [
  {
    name: 'id',
    value: 'string · 自动生成',
    description: '指定 ID；重复添加同 ID 的打开消息会更新并重新计时。',
  },
  {
    name: 'duration',
    value: 'number · 4000ms',
    description:
      '自动关闭时间；0 或 Infinity 常驻。Promise 的 loading 阶段不会自动关闭。',
  },
  {
    name: 'onClose',
    value: '() => void',
    description: '消息关闭时触发，包括超时、关闭按钮、滑动和 API 关闭。',
  },
  {
    name: 'onRemove',
    value: '() => void',
    description: '退场结束、消息从列表移除时触发。',
  },
];
const code = `import { Toast } from '@novelia/web-kit';

Toast.success('保存成功');
Toast.warning('请检查配置', { duration: 8000 });

const id = Toast.info('等待处理', { duration: 0 });
Toast.update(id, { message: '处理完成', status: 'success', duration: 3000 });
Toast.dismiss(id);

const result = await Toast.promise(saveSettings(), {
  loading: '正在保存…',
  success: { message: '已保存', duration: 2000 },
  error: { message: '保存失败', duration: 6000 },
});`;
</script>

<template>
  <ComponentPage
    title="通知 · Toast"
    description="用于操作反馈和异步任务状态。通知显示在顶部居中，支持进出场动画、上滑关闭、单条更新与 Promise 状态切换。"
    :code="code"
  >
    <section aria-labelledby="toast-types">
      <h2 id="toast-types" class="mb-2 font-medium">通知类型</h2>
      <p class="mb-4 text-sm text-muted">
        默认 4 秒后关闭。每次点击创建新通知，可连续点击观察堆叠与进出场动画。
      </p>
      <div class="flex flex-wrap gap-3">
        <XButton @click="track(Toast.success('操作成功，设置已保存'))">
          成功
        </XButton>
        <XButton
          color="danger"
          @click="track(Toast.error('操作失败，请稍后重试'))"
        >
          错误
        </XButton>
        <XButton
          color="neutral"
          variant="outline"
          @click="track(Toast.info('有新的内容可供查看'))"
        >
          信息
        </XButton>
        <XButton
          color="neutral"
          variant="outline"
          @click="track(Toast.warning('继续操作前请检查配置'))"
        >
          警告
        </XButton>
      </div>
    </section>

    <section
      aria-labelledby="toast-content"
      class="border-t border-divider pt-6"
    >
      <h2 id="toast-content" class="mb-2 font-medium">时长、内容与堆叠</h2>
      <p class="mb-4 text-sm text-muted">
        检查多行换行、长文本和窄屏适配；悬停或聚焦通知时暂停计时，移开后继续。
      </p>
      <div class="flex flex-wrap gap-3">
        <XButton
          color="neutral"
          variant="outline"
          @click="
            track(Toast.info('这条通知将在 1 秒后关闭', { duration: 1000 }))
          "
        >
          短时 · 1 秒
        </XButton>
        <XButton
          color="neutral"
          variant="outline"
          @click="
            track(
              Toast.warning('这条通知停留 8 秒，可悬停检查计时暂停', {
                duration: 8000,
              }),
            )
          "
        >
          长时 · 8 秒
        </XButton>
        <XButton
          color="neutral"
          variant="outline"
          @click="
            track(Toast.success('导入完成\n成功：24 条\n跳过：2 条重复记录'))
          "
        >
          多行内容
        </XButton>
        <XButton
          color="neutral"
          variant="outline"
          @click="
            track(
              Toast.info(
                '长文本自动换行：这是一条用于检查窄屏布局和最大宽度的通知。连续标识符：' +
                  'long_identifier_'.repeat(12),
                { duration: 8000 },
              ),
            )
          "
        >
          长文本
        </XButton>
        <XButton color="neutral" variant="outline" @click="showStack">
          连续显示三条
        </XButton>
        <XButton color="neutral" variant="ghost" @click="Toast.dismissAll()">
          关闭全部通知
        </XButton>
      </div>
    </section>

    <section
      aria-labelledby="toast-lifecycle"
      class="border-t border-divider pt-6"
    >
      <h2 id="toast-lifecycle" class="mb-2 font-medium">
        常驻、更新与生命周期
      </h2>
      <p class="mb-4 text-sm text-muted">
        duration: 0 不自动关闭。重复点击创建按钮复用同一
        ID；更新后改为成功状态并重新计时。日志区分关闭和动画结束后的移除。
      </p>
      <div class="mb-3 flex flex-wrap gap-3">
        <XButton color="neutral" variant="outline" @click="showEditable">
          {{ editableId ? '同 ID 更新' : '创建常驻通知' }}
        </XButton>
        <XButton
          color="neutral"
          variant="outline"
          :disabled="!editableId"
          @click="updateEditable"
        >
          更新为成功 · 3 秒
        </XButton>
        <XButton
          color="neutral"
          variant="outline"
          :disabled="!editableId"
          @click="editableId && Toast.dismiss(editableId)"
        >
          关闭此条
        </XButton>
        <XButton
          color="neutral"
          variant="ghost"
          :disabled="!logs.length"
          @click="logs = []"
        >
          清空日志
        </XButton>
      </div>
      <p class="mb-3 break-all text-xs text-muted">
        当前 ID：{{ editableId ?? '无打开的常驻通知' }}
      </p>
      <div class="rounded-sm border border-border bg-surface p-4">
        <h3 class="mb-2 text-sm font-medium">最近事件（最多 12 条）</h3>
        <ol v-if="logs.length" class="space-y-2 text-xs">
          <li
            v-for="entry in logs"
            :key="entry.key"
            class="flex flex-wrap gap-x-3 gap-y-1"
          >
            <time class="text-muted">{{ entry.time }}</time>
            <span class="break-all">{{ entry.message }}</span>
          </li>
        </ol>
        <p v-else class="text-xs text-muted">
          创建常驻通知后，在这里观察回调顺序。
        </p>
      </div>
    </section>

    <section
      aria-labelledby="toast-promise"
      class="border-t border-divider pt-6"
    >
      <h2 id="toast-promise" class="mb-2 font-medium">Promise · 加载到结果</h2>
      <p class="mb-4 text-sm text-muted">
        先开始请求，再手动模拟成功或失败，观察同一条通知的状态切换。也可在请求结束前关闭
        loading 通知，后续结果不会重新打开它。
      </p>
      <div class="flex flex-wrap gap-3">
        <XButton :disabled="pending" @click="startOperation">
          开始模拟请求
        </XButton>
        <XButton
          color="neutral"
          variant="outline"
          :disabled="!pending"
          @click="finishOperation?.(false)"
        >
          模拟成功
        </XButton>
        <XButton
          color="danger"
          :disabled="!pending"
          @click="finishOperation?.(true)"
        >
          模拟失败
        </XButton>
      </div>
      <p class="mt-3 text-sm text-muted" role="status">{{ result }}</p>
      <p class="mt-2 text-xs leading-6 text-muted">
        成功通知停留 2 秒，错误通知停留 6 秒。error
        文案作为前缀，与提取到的错误详情组合；省略某个结果阶段的消息时，会直接关闭
        loading 通知。
      </p>
    </section>

    <section
      aria-labelledby="toast-interaction"
      class="border-t border-divider pt-6"
    >
      <h2 id="toast-interaction" class="mb-3 font-medium">交互与接入说明</h2>
      <ul class="list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
        <li>
          通知容器由 WebKitApp 提供，只需调用 Toast
          API，无需在每个页面重复挂载。
        </li>
        <li>向上拖动超过阈值可关闭，未达到阈值会回弹；也可点击关闭按钮。</li>
        <li>按 F8 聚焦通知区域，通过 Tab 切换焦点，Esc 关闭通知。</li>
        <li>入场淡入下滑，退场淡出上移；系统开启“减少动态效果”时禁用动画。</li>
        <li>离开本示例页会关闭本页创建的通知，不会清空其他页面的通知。</li>
      </ul>
    </section>

    <section aria-labelledby="toast-api" class="border-t border-divider pt-6">
      <h2 id="toast-api" class="mb-4 font-medium">API</h2>
      <dl class="space-y-4 text-sm">
        <div v-for="item in api" :key="item.name">
          <dt class="mb-1 break-words">
            <code>{{ item.name }}</code>
          </dt>
          <dd class="leading-6 text-muted">{{ item.description }}</dd>
        </div>
      </dl>
      <h3 class="mb-3 mt-6 font-medium">ToastOptions</h3>
      <div class="overflow-x-auto rounded-sm border border-border">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-divider bg-surface">
            <tr>
              <th scope="col" class="px-4 py-3 font-medium">选项</th>
              <th scope="col" class="px-4 py-3 font-medium">类型 / 默认值</th>
              <th scope="col" class="px-4 py-3 font-medium">说明</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-divider">
            <tr v-for="item in options" :key="item.name">
              <td class="px-4 py-3">
                <code>{{ item.name }}</code>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-xs">
                <code>{{ item.value }}</code>
              </td>
              <td class="min-w-64 px-4 py-3 leading-6 text-muted">
                {{ item.description }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs leading-6 text-muted">
        Toast.update 的选项不含 id，额外支持 message 和 status；status 可为
        loading、success、error、info、warning。Promise 的 loading / success /
        error 可传字符串或包含 message、duration、onClose、onRemove
        的对象，阶段选项覆盖公共选项。
      </p>
    </section>
  </ComponentPage>
</template>
