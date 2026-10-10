import { ref, watch, type Ref } from 'vue';

export interface StoredRefOptions<T> {
  /** 存储键名。 */
  key: string;
  /** 存储区域；缺失时只保留内存镜像。 */
  storage?: Storage;
  /** 解码存储值；返回 undefined 表示值无效，按“没有存储值”处理并删除该键。 */
  decode(raw: string): T | undefined;
  /** 编码存储值；返回 undefined 表示删除该键（例如退出登录）。 */
  encode(value: T): string | undefined;
  /** 没有可用存储值时的内存初值。 */
  fallback(): T;
}

/**
 * 把 localStorage 的一个键包装成 Ref：读取时解码，赋值时编码落盘，
 * 其他标签页改动同一键时通过 storage 事件同步到内存。
 */
export function createStoredRef<T>(options: StoredRefOptions<T>): Ref<T> {
  const { key, storage: area } = options;
  // 记住存储中的原始字符串：值没变就不写，避免两个标签页互相回写。
  let raw: string | null = null;
  let applyingExternal = false;

  function read(): string | null {
    if (!area) return null;
    try {
      return area.getItem(key);
    } catch {
      return null;
    }
  }

  function write(next: string | null) {
    if (raw === next) return;
    raw = next;
    if (!area) return;
    try {
      if (next === null) area.removeItem(key);
      else area.setItem(key, next);
    } catch {
      // 写入失败时内存镜像仍然可用，不影响本次会话。
    }
  }

  /** 以存储中的原始值为准刷新内存；顺带删除无效值，避免每次启动重复解析。 */
  function fromStorage(stored: string | null): T {
    raw = stored;
    if (stored === null) return options.fallback();
    const decoded = options.decode(stored);
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
      if (applyingExternal || !area) return;
      const encoded = options.encode(value);
      write(encoded === undefined ? null : encoded);
    },
    { flush: 'sync' },
  );

  if (
    area &&
    typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function'
  ) {
    window.addEventListener('storage', (event) => {
      // 只处理同一存储区域、同一键；key 为 null 表示整片存储被清空。
      if (event.storageArea !== area) return;
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
