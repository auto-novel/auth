import type { AttentionStatus, StrikeReadState } from './auth/requests';
import type { SessionUser } from './auth/user';
import { readonly, ref, type DeepReadonly, type Ref } from 'vue';

export interface AttentionContext {
  readonly status: DeepReadonly<Ref<AttentionStatus | undefined>>;
  readonly refresh: () => Promise<void>;
  readonly updateStrikeReadState: (throughId: number) => Promise<void>;
}

interface AttentionSession {
  userId: number;
  pendingThroughId?: number;
  request?: Promise<void>;
}

interface AttentionApi {
  watchUser(listener: (user?: SessionUser) => void): () => void;
  getAttentionStatus(): Promise<AttentionStatus>;
  updateMyStrikeReadState(throughId: number): Promise<StrikeReadState>;
}

const POLL_INTERVAL = 60 * 1000;

export function createAttention(api: AttentionApi) {
  const status = ref<AttentionStatus>();
  let session: AttentionSession | undefined;
  let disposed = false;
  let started = false;
  let timer: number | undefined;
  let unsubscribe: (() => void) | undefined;
  let visibilityTarget: Document | undefined;

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

  function stopTimer() {
    if (timer === undefined) return;
    globalThis.clearInterval(timer);
    timer = undefined;
  }

  /** 只在已登录时保留轮询定时器。 */
  function syncTimer() {
    if (started && !disposed && session) {
      timer ??= globalThis.setInterval(refreshWhenVisible, POLL_INTERVAL);
      return;
    }
    stopTimer();
  }

  function refreshWhenVisible() {
    if (typeof document === 'undefined') return;
    if (document.visibilityState === 'visible') void refresh();
  }

  function handleUser(user: SessionUser | undefined) {
    if (disposed || user?.id === session?.userId) return;
    session = user ? { userId: user.id } : undefined;
    status.value = undefined;
    syncTimer();
    if (session) void refresh();
  }

  /** 订阅会话并挂上定时器与可见性监听。由 kit.start 触发。 */
  function start() {
    if (started || disposed) return;
    started = true;
    if (typeof document !== 'undefined') {
      visibilityTarget = document;
      visibilityTarget.addEventListener('visibilitychange', refreshWhenVisible);
    }
    unsubscribe = api.watchUser(handleUser);
    syncTimer();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    started = false;
    session = undefined;
    status.value = undefined;
    stopTimer();
    visibilityTarget?.removeEventListener(
      'visibilitychange',
      refreshWhenVisible,
    );
    visibilityTarget = undefined;
    unsubscribe?.();
    unsubscribe = undefined;
  }

  const context: AttentionContext = Object.freeze({
    status: readonly(status),
    refresh,
    updateStrikeReadState,
  });

  return { context, start, dispose };
}
