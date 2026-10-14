import {
  computed,
  readonly,
  ref,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue';

import { useLocalStorage } from '../storage';

/** 实际生效的外观。 */
export type Theme = 'light' | 'dark';
/** 用户偏好：`Theme` 为固定外观，`'system'`（默认）为跟随系统。 */
export type ThemePreference = Theme | 'system';

/** 临时主题覆盖，不写入站点偏好。 */
export interface ThemeOverride {
  readonly preference?: ThemePreference;
  readonly tokens?: Readonly<Record<`--${string}`, string>>;
  /** 浏览器主题色；默认取覆盖的 --color-body，否则使用明暗基底默认值。 */
  readonly themeColor?: string;
}

export interface WebTheme {
  readonly theme: Readonly<Ref<Theme>>;
  readonly preference: Readonly<Ref<ThemePreference>>;
  readonly override: Readonly<Ref<ThemeOverride | undefined>>;
  readonly isDark: ComputedRef<boolean>;
  /** 整体替换覆盖并复制参数，不追踪后续修改。 */
  readonly setOverride: (override: ThemeOverride) => void;
  readonly clearOverride: () => void;
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
  let transitionTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  const override = shallowRef<ThemeOverride>();
  const originalTokens = new Map<string, { value: string; priority: string }>();

  function applyTokens(tokens: ThemeOverride['tokens']) {
    const style = document.documentElement.style;
    for (const [name, original] of originalTokens) {
      if (tokens && Object.prototype.hasOwnProperty.call(tokens, name))
        continue;
      if (original.value) {
        style.setProperty(name, original.value, original.priority);
      } else {
        style.removeProperty(name);
      }
      originalTokens.delete(name);
    }
    for (const [name, value] of Object.entries(tokens ?? {})) {
      if (!originalTokens.has(name)) {
        originalTokens.set(name, {
          value: style.getPropertyValue(name),
          priority: style.getPropertyPriority(name),
        });
      }
      style.setProperty(name, value);
    }
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
    applyTokens(override.value?.tokens);
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute(
        'content',
        override.value?.themeColor ??
          override.value?.tokens?.['--color-body'] ??
          THEME_COLORS[theme],
      );

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

  const currentTheme = computed<Theme>(() => {
    const effectivePreference = override.value?.preference ?? preference.value;
    return effectivePreference === 'system'
      ? system.value
      : effectivePreference;
  });

  applyTheme(currentTheme.value);
  watch([currentTheme, override], ([theme]) => applyTheme(theme, true), {
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

  function setOverride(next: ThemeOverride) {
    if (next.preference !== undefined && !isThemePreference(next.preference)) {
      throw new TypeError('Invalid theme override preference');
    }
    const tokens: Record<`--${string}`, string> = {};
    for (const [name, value] of Object.entries(next.tokens ?? {})) {
      if (
        !name.startsWith('--') ||
        name.length === 2 ||
        typeof value !== 'string'
      ) {
        throw new TypeError(
          'Theme override tokens must be CSS custom properties',
        );
      }
      tokens[name as `--${string}`] = value;
    }
    if (next.preference === 'system') system.value = systemTheme();
    override.value = Object.freeze({
      preference: next.preference,
      tokens: Object.freeze(tokens),
      themeColor: next.themeColor,
    });
  }

  function clearOverride() {
    override.value = undefined;
  }

  const context: WebTheme = Object.freeze({
    theme: readonly(currentTheme),
    preference: readonly(preference),
    override: readonly(override),
    setOverride,
    clearOverride,
    isDark,
    setPreference,
    toggleTheme,
  });
  return context;
}
