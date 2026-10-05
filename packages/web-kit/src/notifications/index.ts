import { readonly, ref } from 'vue';

export interface AppNotification {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const items = ref<AppNotification[]>([]);
let nextId = 0;

function add(type: AppNotification['type'], message: string) {
  items.value.unshift({ id: ++nextId, type, message });
}

/** 唯一的应用级通知队列；由 WebKitApp 渲染，不随 kit 创建而切换。 */
export const Notify = {
  success(message: string) {
    add('success', message);
  },
  error(message: string) {
    add('error', message);
  },
  dismissAll() {
    items.value = [];
  },
} as const;

/** 内部渲染接口，不从包入口导出。 */
export const notifications = {
  items: readonly(items),
  dismiss(id: number) {
    const index = items.value.findIndex(
      (notification) => notification.id === id,
    );
    if (index >= 0) items.value.splice(index, 1);
  },
};
