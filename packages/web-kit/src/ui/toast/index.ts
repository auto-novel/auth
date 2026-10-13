import { createToastManager } from 'reka-ui';
import { getApiErrorMessage } from './apiError.ts';

export type ToastId = string;
export type ToastStatus = 'loading' | 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  /** 自定义 ID；重复添加同一条打开的消息会更新内容并重新计时。 */
  id?: ToastId;
  /** 自动关闭时间（毫秒），默认 4000；0 或 Infinity 表示不自动关闭。 */
  duration?: number;
  /** 消息关闭时触发（包括自动关闭和手动关闭）。 */
  onClose?: () => void;
  /** 消息退出动画结束、从列表移除时触发。 */
  onRemove?: () => void;
}

export interface ToastUpdateOptions extends Omit<ToastOptions, 'id'> {
  message?: string;
  status?: ToastStatus;
}

export interface ToastMessage extends Omit<ToastOptions, 'id'> {
  message: string;
}

export interface ToastPromiseMessages {
  loading?: string | ToastMessage;
  success?: string | ToastMessage;
  error?: string | ToastMessage;
}

export const toastManager = createToastManager();

function add(
  status: ToastStatus,
  message: string,
  options: ToastOptions = {},
): ToastId {
  return toastManager.add({ ...options, status, description: message });
}

function resolveMessage(message: string | ToastMessage): ToastMessage {
  return typeof message === 'string' ? { message } : message;
}

export const Toast = {
  promise<Value>(
    promise: Promise<Value>,
    messages: ToastPromiseMessages = {},
    options: ToastOptions = {},
  ): Promise<Value | undefined> {
    let id: ToastId | undefined;
    if (messages.loading !== undefined) {
      const { message, ...lifecycle } = resolveMessage(messages.loading);
      id = add('loading', message, { ...options, ...lifecycle });
    }

    function settle(
      status: 'success' | 'error',
      message?: string | ToastMessage,
      reason?: unknown,
    ) {
      if (message === undefined) {
        if (id !== undefined) toastManager.close(id);
        return;
      }
      const { message: text, ...lifecycle } = resolveMessage(message);
      const description =
        status === 'error' ? getApiErrorMessage(reason, text) : text;
      // 不让 loading 阶段的常驻配置泄漏到结果阶段。
      const settledOptions = {
        ...options,
        duration: options.duration,
        ...lifecycle,
      };
      if (id === undefined) {
        add(status, description, settledOptions);
      } else {
        const { id: _id, ...updates } = settledOptions;
        toastManager.update(id, { ...updates, status, description });
      }
    }

    return promise.then(
      (value) => {
        settle('success', messages.success);
        return value;
      },
      (reason: unknown) => {
        settle('error', messages.error, reason);
        return undefined;
      },
    );
  },
  success(message: string, options?: ToastOptions): ToastId {
    return add('success', message, options);
  },
  error(message: string, options?: ToastOptions): ToastId {
    return add('error', message, options);
  },
  info(message: string, options?: ToastOptions): ToastId {
    return add('info', message, options);
  },
  warning(message: string, options?: ToastOptions): ToastId {
    return add('warning', message, options);
  },
  /** 只更新打开的消息；不会重新打开已关闭的消息。 */
  update(id: ToastId, options: ToastUpdateOptions) {
    const { message, ...updates } = options;
    toastManager.update(id, {
      ...updates,
      ...(message === undefined ? {} : { description: message }),
    });
  },
  dismiss(id: ToastId) {
    toastManager.close(id);
  },
  dismissAll() {
    toastManager.close();
  },
} as const;
