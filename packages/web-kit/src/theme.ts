import {
  computed,
  readonly,
  ref,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue';

import { useLocalStorage } from './storage';

/** 实际生效的外观。 */
export type Theme = 'light' | 'dark';
/** 用户偏好：`Theme` 为固定外观，`'system'`（默认）为跟随系统。 */
export type ThemePreference = Theme | 'system';

export interface WebTheme {
  readonly theme: Readonly<Ref<Theme>>;
  readonly preference: Readonly<Ref<ThemePreference>>;
  readonly isDark: ComputedRef<boolean>;
  readonly setPreference: (preference: ThemePreference) => void;
  /** 按当前生效外观取反，并落盘为具体偏好（二态，不写回 `'system'`）。 */
  readonly toggleTheme: () => void;
}

const TRANSITION_DURATION = 200;
const THEME_STORAGE_KEY = 'web-kit:theme:v1';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';
const THEME_COLORS: Record<Theme, string> = {
  dark: '#101014',
  light: '#ffffff',
};

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** 取系统偏好；非浏览器环境退化为浅色。 */
function systemTheme(): Theme {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return 'light';
  }
  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light';
}

/** 订阅系统偏好变化；不支持监听的环境静默跳过。 */
function watchSystemTheme(onChange: (theme: Theme) => void) {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return;
  }
  const query = window.matchMedia(SYSTEM_THEME_QUERY);
  if (typeof query.addEventListener !== 'function') return;
  query.addEventListener('change', (event) => {
    onChange(event.matches ? 'dark' : 'light');
  });
}

export function createWebTheme() {
  let transitionTimer: number | undefined;

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

  const system = ref(systemTheme());
  watchSystemTheme((theme) => {
    system.value = theme;
  });

  const preference = useLocalStorage<ThemePreference>(THEME_STORAGE_KEY, {
    validate: (value) => (isThemePreference(value) ? value : undefined),
    fallback: () => 'system',
  });

  const currentTheme = computed<Theme>(() =>
    preference.value === 'system' ? system.value : preference.value,
  );

  applyTheme(currentTheme.value);
  // 本页切换、其他标签页的 storage 事件和系统偏好变化都走这里，跨标签同步同样带过渡。
  watch(currentTheme, (theme) => applyTheme(theme, true), {
    flush: 'sync',
  });

  const isDark = computed(() => currentTheme.value === 'dark');

  function setPreference(next: ThemePreference) {
    if (!isThemePreference(next)) return;
    if (next === 'system') system.value = systemTheme();
    preference.value = next;
  }

  function toggleTheme() {
    setPreference(isDark.value ? 'light' : 'dark');
  }

  const context: WebTheme = Object.freeze({
    theme: readonly(currentTheme),
    preference: readonly(preference),
    isDark,
    setPreference,
    toggleTheme,
  });
  return context;
}
