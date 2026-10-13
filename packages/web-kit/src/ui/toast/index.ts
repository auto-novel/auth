import { createToastManager } from 'reka-ui';
import { getApiErrorMessage } from './apiError.ts';

export const toastManager = createToastManager();

export const Toast = {
  promise<Value>(
    promise: Promise<Value>,
    messages: { loading?: string; success?: string; error?: string } = {},
  ): Promise<Value> {
    const id =
      messages.loading === undefined
        ? undefined
        : toastManager.add({
            status: 'loading',
            description: messages.loading,
          });

    function settle(status: 'success' | 'error', description?: string) {
      if (description === undefined) {
        if (id !== undefined) toastManager.close(id);
      } else if (id === undefined) {
        toastManager.add({ status, description });
      } else {
        toastManager.update(id, { status, description });
      }
    }

    return promise.then(
      (value) => {
        settle('success', messages.success);
        return value;
      },
      (reason: unknown) => {
        settle(
          'error',
          messages.error === undefined
            ? undefined
            : getApiErrorMessage(reason, messages.error),
        );
        throw reason;
      },
    );
  },
  success(message: string) {
    toastManager.add({ status: 'success', description: message });
  },
  error(message: string) {
    toastManager.add({ status: 'error', description: message });
  },
  dismissAll() {
    toastManager.close();
  },
} as const;
