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
  let timer: number | undefined;

  async function synchronize(current: AttentionSession) {
    while (session === current) {
      if (current.pendingThroughId !== undefined) {
        const throughId = current.pendingThroughId;
        const result = await api.updateMyStrikeReadState(throughId);
        if (session !== current) return;
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
      if (session !== current) return;
      if (current.pendingThroughId !== undefined) continue;
      status.value = result;
      return;
    }
  }

  function refresh(): Promise<void> {
    const current = session;
    if (!current) return Promise.resolve();
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
    if (!session) return Promise.resolve();
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
    if (session) {
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
    if (user?.id === session?.userId) return;
    session = user ? { userId: user.id } : undefined;
    status.value = undefined;
    syncTimer();
    if (session) void refresh();
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', refreshWhenVisible);
  }
  api.watchUser(handleUser);
  syncTimer();

  const context: AttentionContext = Object.freeze({
    status: readonly(status),
    refresh,
    updateStrikeReadState,
  });

  return context;
}
