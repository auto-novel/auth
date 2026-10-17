import { computed, shallowReactive, shallowReadonly } from 'vue';
import { uploadFile, type UploadRequestOptions } from './uploadFile.ts';

export type UploadStatus =
  'idle' | 'uploading' | 'success' | 'error' | 'canceled';

export interface UploadProgressItem {
  readonly status: UploadStatus;
  readonly loaded: number;
  readonly total: number | null;
  readonly error: unknown;
  readonly isUploading: boolean;
  /** 0–100；总大小未知时为 null，成功后为 100。 */
  readonly progress: number | null;
}

type UploadState = Pick<
  UploadProgressItem,
  'status' | 'loaded' | 'total' | 'error'
>;

function createItem(state: UploadState): UploadProgressItem {
  return Object.freeze({
    ...state,
    isUploading: state.status === 'uploading',
    progress:
      state.status === 'success'
        ? 100
        : state.total === null
          ? null
          : state.total === 0
            ? 0
            : (state.loaded / state.total) * 100,
  });
}

/** 管理一批固定文件的上传生命周期；调用 upload 才会发起请求。 */
export function useUploadProgress(files: readonly File[]) {
  const items = shallowReactive(new Map<File, UploadProgressItem>());
  const active = new Map<File, AbortController>();

  function initialState(file: File, status: UploadStatus = 'idle') {
    return createItem({
      status,
      loaded: 0,
      total: file.size,
      error: undefined,
    });
  }

  for (const file of files) items.set(file, initialState(file));

  /** 真正中断请求；空闲、已结束或未知文件不做处理。 */
  function cancel(file: File) {
    const controller = active.get(file);
    if (!controller) return;
    // 释放任务所有权后再取消，允许立即重试，旧请求不会修改新任务。
    active.delete(file);
    controller.abort();
    items.set(file, createItem({ ...items.get(file)!, status: 'canceled' }));
  }

  /** 开始或重试已有文件，同一文件不允许重复发起活跃请求。 */
  async function upload(
    file: File,
    options: UploadRequestOptions,
  ): Promise<Response> {
    if (!items.has(file)) throw new Error('文件未登记到上传进度中');
    if (active.has(file)) throw new Error('该文件正在上传');

    const controller = new AbortController();
    active.set(file, controller);
    items.set(file, initialState(file, 'uploading'));
    const onAbort = () => {
      if (active.get(file) === controller) cancel(file);
    };

    try {
      if (options.signal?.aborted) onAbort();
      else options.signal?.addEventListener('abort', onAbort, { once: true });
      const response = await uploadFile(file, {
        ...options,
        signal: controller.signal,
        onProgress: (event) => {
          if (active.get(file) !== controller) return;
          items.set(file, createItem({ ...items.get(file)!, ...event }));
        },
      });
      if (active.get(file) === controller) {
        active.delete(file);
        const item = items.get(file)!;
        items.set(
          file,
          createItem({
            ...item,
            status: 'success',
            loaded: item.total ?? item.loaded,
          }),
        );
      }
      return response;
    } catch (error) {
      if (active.get(file) === controller) {
        active.delete(file);
        const canceled =
          error instanceof DOMException && error.name === 'AbortError';
        items.set(
          file,
          createItem({
            ...items.get(file)!,
            status: canceled ? 'canceled' : 'error',
            error: canceled ? undefined : error,
          }),
        );
      }
      throw error;
    } finally {
      options.signal?.removeEventListener('abort', onAbort);
    }
  }

  return {
    uploads: shallowReadonly(items) as ReadonlyMap<File, UploadProgressItem>,
    isUploading: computed(() =>
      [...items.values()].some((item) => item.isUploading),
    ),
    upload,
    cancel,
  };
}

export type UploadProgress = ReturnType<typeof useUploadProgress>;
