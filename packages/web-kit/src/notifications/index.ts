import { ref } from 'vue';

interface AppNotification {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export const notifications = ref<AppNotification[]>([]);

let nextNotificationId = 0;

function addNotification(type: AppNotification['type'], message: string) {
  notifications.value.unshift({
    id: ++nextNotificationId,
    type,
    message,
  });
}

export const Notify = {
  success(message: string) {
    addNotification('success', message);
  },
  error(message: string) {
    addNotification('error', message);
  },
} as const;

export function dismissNotification(id: number) {
  const index = notifications.value.findIndex(
    (notification) => notification.id === id,
  );
  if (index >= 0) notifications.value.splice(index, 1);
}
