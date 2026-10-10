import { ref, watch, type Ref } from 'vue';

export interface StoredRefOptions<T> {
  /** 解码存储值；默认 JSON.parse。抛异常或返回 undefined 视为无效，会删除该键。 */
  decode?(raw: string): unknown;
  /** 把解码结果收窄成 T；默认原样接受。返回 undefined 视为无效，会删除该键。 */
  validate?(value: unknown): T | undefined;
  /** 编码存储值；默认 JSON.stringify。返回 undefined 表示删除该键（例如退出登录）。 */
  encode?(value: T): string | undefined;
  /** 没有可用存储值时的内存初值。 */
  fallback(): T;
}

function encodeJson(value: unknown): string | undefined {
  return value === undefined ? undefined : JSON.stringify(value);
}

export function useStorage<T>(
  key: string,
  storage: Storage | undefined,
  options: StoredRefOptions<T>,
): Ref<T> {
  // 记住存储中的原始字符串：值没变就不写，避免两个标签页互相回写。
  let raw: string | null = null;
  let applyingExternal = false;

  function read(): string | null {
    if (!storage) return null;
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function write(next: string | null) {
    if (raw === next) return;
    raw = next;
    if (!storage) return;
    try {
      if (next === null) storage.removeItem(key);
      else storage.setItem(key, next);
    } catch {
      // 写入失败时内存镜像仍然可用，不影响本次会话。
    }
  }

  function decode(stored: string): T | undefined {
    try {
      const value = options.decode
        ? options.decode(stored)
        : JSON.parse(stored);
      return options.validate ? options.validate(value) : (value as T);
    } catch {
      // 编解码抛异常按无效值处理，同样走删除 + fallback。
      return undefined;
    }
  }

  /** 以存储中的原始值为准刷新内存；顺带删除无效值，避免每次启动重复解析。 */
  function fromStorage(stored: string | null): T {
    raw = stored;
    if (stored === null) return options.fallback();
    const decoded = decode(stored);
    if (decoded === undefined) {
      write(null);
      return options.fallback();
    }
    return decoded;
  }

  const current = ref(fromStorage(read())) as Ref<T>;

  watch(
    current,
    (value) => {
      // 外部变更不回写，否则会和其他标签页来回触发 storage 事件；
      // 没有可用存储时连编码都跳过，只保留内存镜像。
      if (applyingExternal || !storage) return;
      let encoded: string | null;
      try {
        const text = options.encode ? options.encode(value) : encodeJson(value);
        encoded = text === undefined ? null : text;
      } catch {
        // 编码失败就不动存储，内存值照常可用。
        return;
      }
      write(encoded);
    },
    { deep: true, flush: 'sync' },
  );

  if (
    storage &&
    typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function'
  ) {
    window.addEventListener('storage', (event) => {
      // 只处理同一存储区域、同一键；key 为 null 表示整片存储被清空。
      if (event.storageArea !== storage) return;
      if (event.key !== null && event.key !== key) return;
      // 重新读取当前值：排队的事件可能已经过期，也不能让它覆盖更新的数据。
      applyingExternal = true;
      try {
        current.value = fromStorage(read());
      } finally {
        applyingExternal = false;
      }
    });
  }

  return current;
}

/** 浏览器禁用存储（隐私模式）或非浏览器环境返回 undefined。 */
function resolveStorage(
  name: 'localStorage' | 'sessionStorage',
): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window[name];
  } catch {
    return undefined;
  }
}

export function useLocalStorage<T>(
  key: string,
  options: StoredRefOptions<T>,
): Ref<T> {
  return useStorage(key, resolveStorage('localStorage'), options);
}

export function useSessionStorage<T>(
  key: string,
  options: StoredRefOptions<T>,
): Ref<T> {
  return useStorage(key, resolveStorage('sessionStorage'), options);
}
