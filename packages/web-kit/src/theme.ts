import { computed, readonly, ref } from 'vue';

type Theme = 'light' | 'dark';

const TRANSITION_DURATION = 200;
const THEME_COLORS: Record<Theme, string> = {
  dark: '#101014',
  light: '#f7f7f8',
};

export function createWebTheme(storageKey: string, storage?: Storage) {
  const currentTheme = ref<Theme>('light');
  let transitionTimer: number | undefined;
  let started = false;

  function storedTheme(): Theme | undefined {
    try {
      const value = storage?.getItem(storageKey);
      return value === 'light' || value === 'dark' ? value : undefined;
    } catch {
      return undefined;
    }
  }

  function preferredTheme(): Theme {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme: Theme, animated = false) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (animated) {
      window.clearTimeout(transitionTimer);
      root.classList.add('theme-transition');
      void root.offsetWidth;
    }

    root.dataset.theme = theme;
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[theme]);

    if (animated) {
      transitionTimer = window.setTimeout(() => {
        root.classList.remove('theme-transition');
        transitionTimer = undefined;
      }, TRANSITION_DURATION);
    }
  }

  /** 读取已保存（或系统）主题并写入 `<html>`。由 `install` 触发。 */
  function start() {
    if (started) return;
    started = true;
    currentTheme.value = storedTheme() ?? preferredTheme();
    applyTheme(currentTheme.value);
  }

  const isDark = computed(() => currentTheme.value === 'dark');

  function toggleTheme() {
    currentTheme.value = isDark.value ? 'light' : 'dark';
    applyTheme(currentTheme.value, true);
    try {
      storage?.setItem(storageKey, currentTheme.value);
    } catch {
      // Theme changes remain usable without persistence.
    }
  }

  function dispose() {
    if (transitionTimer !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(transitionTimer);
    }
    transitionTimer = undefined;
  }

  return {
    theme: readonly(currentTheme),
    isDark,
    toggleTheme,
    start,
    dispose,
  };
}

export type WebTheme = ReturnType<typeof createWebTheme>;
