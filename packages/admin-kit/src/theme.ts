import { readonly, ref, type Ref } from 'vue';

export interface AdminTheme {
  isDark: Readonly<Ref<boolean>>;
  toggleTheme(): void;
}

export function createAdminTheme(storageKey: string, storage?: Storage) {
  const isDark = ref(false);
  let started = false;
  let disposed = false;

  function start() {
    if (started || disposed) return;
    started = true;
    let savedTheme: string | null | undefined;
    try {
      savedTheme = storage?.getItem(storageKey);
    } catch {
      // Use the system preference when stored preferences cannot be read.
    }
    isDark.value =
      savedTheme === 'dark' || savedTheme === 'light'
        ? savedTheme === 'dark'
        : typeof window !== 'undefined' &&
          !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  }

  function toggleTheme() {
    if (!started || disposed) return;
    isDark.value = !isDark.value;
    try {
      storage?.setItem(storageKey, isDark.value ? 'dark' : 'light');
    } catch {
      // Theme changes remain usable without persistence.
    }
  }

  function dispose() {
    disposed = true;
  }

  const context: AdminTheme = { isDark: readonly(isDark), toggleTheme };
  return { context, start, dispose };
}
