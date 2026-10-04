import { readonly, ref } from 'vue';

export interface AppNotification {
  id: number;
  type: 'success' | 'error';
  message: string;
}

/**
 * 创建一个通知仓库。每个 `createWebKit` 实例持有自己的仓库，
 * 因此多个实例之间不会共享消息。
 */
export function createNotifications() {
  const items = ref<AppNotification[]>([]);
  let nextId = 0;

  function add(type: AppNotification['type'], message: string) {
    items.value.unshift({
      id: ++nextId,
      type,
      message,
    });
  }

  return {
    items: readonly(items),
    notify: {
      success(message: string) {
        add('success', message);
      },
      error(message: string) {
        add('error', message);
      },
    },
    dismiss(id: number) {
      const index = items.value.findIndex(
        (notification) => notification.id === id,
      );
      if (index >= 0) items.value.splice(index, 1);
    },
    dismissAll() {
      items.value = [];
    },
  };
}

export type Notifications = ReturnType<typeof createNotifications>;

/**
 * 当前生效的仓库，供独立的 `Notify` 导出使用。`createWebKit` 会把它
 * 指向自己创建的仓库，因此 `Notify.success()` 写入的是最近创建的 kit。
 */
let active = createNotifications();

export function activateNotifications(store: Notifications) {
  active = store;
}

/** 应用级通知入口。需要按实例隔离时请用 `useWebKit().notify`。 */
export const Notify = {
  success(message: string) {
    active.notify.success(message);
  },
  error(message: string) {
    active.notify.error(message);
  },
} as const;
