import { computed, readonly, watch, type ComputedRef, type Ref } from 'vue';

import { createStoredRef } from './storage';

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

export function createWebTheme(storageKey: string, area?: Storage) {
  let transitionTimer: number | undefined;

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

  // 存储里没有有效主题时跟随系统偏好；无效值由存储层顺带删除。
  const currentTheme = createStoredRef<Theme>({
    key: storageKey,
    storage: area,
    decode: (raw) => (raw === 'light' || raw === 'dark' ? raw : undefined),
    encode: (theme) => theme,
    fallback: preferredTheme,
  });

  applyTheme(currentTheme.value);
  // 本页切换和其他标签页的 storage 事件都走这里，跨标签同步同样带过渡。
  watch(currentTheme, (theme) => applyTheme(theme, true), {
    flush: 'sync',
  });

  const isDark = computed(() => currentTheme.value === 'dark');

  function toggleTheme() {
    currentTheme.value = isDark.value ? 'light' : 'dark';
  }

  const context: WebTheme = Object.freeze({
    theme: readonly(currentTheme),
    isDark,
    toggleTheme,
  });
  return context;
}
