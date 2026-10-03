import type { AttentionStatus, AuthApi } from '@novelia/auth-api';
import {
  inject,
  readonly,
  ref,
  type DeepReadonly,
  type InjectionKey,
  type Ref,
} from 'vue';

interface AttentionContext {
  status: DeepReadonly<Ref<AttentionStatus | undefined>>;
  refresh(): Promise<void>;
  updateStrikeReadState(throughId: number): Promise<void>;
}

interface AttentionSession {
  userId: number;
  pendingThroughId?: number;
  request?: Promise<void>;
}

type AttentionApi = Pick<
  AuthApi,
  'watchUser' | 'getAttentionStatus' | 'updateMyStrikeReadState'
>;

export function createAttention(api: AttentionApi) {
  const status = ref<AttentionStatus>();
  let session: AttentionSession | undefined;
  let disposed = false;

  async function synchronize(current: AttentionSession) {
    while (!disposed && session === current) {
      if (current.pendingThroughId !== undefined) {
        const throughId = current.pendingThroughId;
        const result = await api.updateMyStrikeReadState(throughId);
        if (disposed || session !== current) return;
        status.value = { ...status.value, strikes: result };
        // Keep any larger boundary queued while the write was in flight.
        if (current.pendingThroughId === throughId) {
          current.pendingThroughId = undefined;
        }
        if (current.pendingThroughId !== undefined) continue;
      }

      // Reads and writes share one queue, so a late write response cannot
      // overwrite a newer query. Always query again after acknowledging.
      const result = await api.getAttentionStatus();
      if (disposed || session !== current) return;
      if (current.pendingThroughId !== undefined) continue;
      status.value = result;
      return;
    }
  }

  function refresh(): Promise<void> {
    const current = session;
    if (disposed || !current) return Promise.resolve();
    if (current.request) return current.request;
    current.request = Promise.resolve()
      .then(() => synchronize(current))
      .catch(() => {
        // Preserve the last state and the pending boundary. A later refresh
        // retries only what this account has actually viewed.
      })
      .finally(() => {
        current.request = undefined;
      });
    return current.request;
  }

  function updateStrikeReadState(throughId: number): Promise<void> {
    if (disposed || !session) return Promise.resolve();
    if (!Number.isSafeInteger(throughId) || throughId < 0) {
      return Promise.resolve();
    }
    session.pendingThroughId = Math.max(
      session.pendingThroughId ?? 0,
      throughId,
    );
    return refresh();
  }

  const unsubscribe = api.watchUser((user) => {
    if (disposed || user?.id === session?.userId) return;
    session = user ? { userId: user.id } : undefined;
    status.value = undefined;
    if (session) void refresh();
  });

  function refreshWhenVisible() {
    if (document.visibilityState === 'visible') void refresh();
  }

  document.addEventListener('visibilitychange', refreshWhenVisible);
  const timer = globalThis.setInterval(refreshWhenVisible, 60 * 1000);

  const context: AttentionContext = {
    status: readonly(status),
    refresh,
    updateStrikeReadState,
  };

  return {
    context,
    dispose() {
      disposed = true;
      session = undefined;
      globalThis.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      unsubscribe();
    },
  };
}

export const attentionKey: InjectionKey<AttentionContext> =
  Symbol('web-kit-attention');

export function useAttention() {
  const attention = inject(attentionKey);
  if (!attention) {
    throw new Error('Web kit is not installed. Call app.use(webKit).');
  }
  return attention;
}
