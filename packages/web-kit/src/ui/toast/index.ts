import { createToastManager } from 'reka-ui';
import { getApiErrorMessage } from '../../utils/apiError.ts';

export const toastManager = createToastManager();

export const Toast = {
  promise<Value>(
    promise: Promise<Value>,
    messages: { loading: string; success: string; error: string },
  ): Promise<Value> {
    return toastManager.promise(promise, {
      loading: { status: 'loading', description: messages.loading },
      success: { status: 'success', description: messages.success },
      error: (reason: unknown) => ({
        status: 'error',
        description: getApiErrorMessage(reason, messages.error),
      }),
    });
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
