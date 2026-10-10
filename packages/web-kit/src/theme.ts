import { computed, readonly, ref, type ComputedRef, type Ref } from 'vue';

export type Theme = 'light' | 'dark';

export interface WebTheme {
  readonly theme: Readonly<Ref<Theme>>;
  readonly isDark: ComputedRef<boolean>;
  readonly toggleTheme: () => void;
}

const TRANSITION_DURATION = 200;
const THEME_COLORS: Record<Theme, string> = {
  dark: '#101014',
  light: '#ffffff',
};

export function createWebTheme(storageKey: string, storage?: Storage) {
  const currentTheme = ref<Theme>('light');
  let transitionTimer: number | undefined;
  let started = false;
  let disposed = false;

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

  function endTransition() {
    if (transitionTimer === undefined) return;
    globalThis.clearTimeout(transitionTimer);
    transitionTimer = undefined;
    document.documentElement.classList.remove('theme-transition');
  }

  function applyTheme(theme: Theme, animated = false) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (animated) {
      endTransition();
      root.classList.add('theme-transition');
      void root.offsetWidth;
    }

    root.dataset.theme = theme;
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[theme]);

    if (animated) {
      transitionTimer = globalThis.setTimeout(
        endTransition,
        TRANSITION_DURATION,
      );
    }
  }

  function start() {
    if (started || disposed) return;
    started = true;
    currentTheme.value = storedTheme() ?? preferredTheme();
    applyTheme(currentTheme.value);
  }

  const isDark = computed(() => currentTheme.value === 'dark');

  function toggleTheme() {
    if (!started || disposed) return;
    currentTheme.value = isDark.value ? 'light' : 'dark';
    applyTheme(currentTheme.value, true);
    try {
      storage?.setItem(storageKey, currentTheme.value);
    } catch {
      // Theme changes remain usable without persistence.
    }
  }

  function dispose() {
    disposed = true;
    endTransition();
  }

  const context: WebTheme = Object.freeze({
    theme: readonly(currentTheme),
    isDark,
    toggleTheme,
  });
  return { context, start, dispose };
}
