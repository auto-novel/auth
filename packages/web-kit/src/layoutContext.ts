import { inject, type InjectionKey } from 'vue';

export interface LayoutContext {
  /** 滚动 `WebKitLayout` 的内容区。不在布局内时退化为滚动窗口。 */
  readonly scrollToTop: (options?: ScrollToOptions) => void;
}

export const layoutKey: InjectionKey<LayoutContext> = Symbol('web-kit-layout');

function fallbackScrollToTop(options?: ScrollToOptions) {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, ...options });
  }
}

const fallbackContext: LayoutContext = Object.freeze({
  scrollToTop: fallbackScrollToTop,
});

export function useWebKitLayout(): LayoutContext {
  return inject(layoutKey, fallbackContext);
}
