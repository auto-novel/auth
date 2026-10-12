import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  type ComputedRef,
} from 'vue';

export type ViewportMode = 'mobile' | 'tablet' | 'desktop';

export interface WebKitViewport {
  readonly viewportMode: ComputedRef<ViewportMode>;
  readonly isMobile: ComputedRef<boolean>;
  readonly isTablet: ComputedRef<boolean>;
  readonly isDesktop: ComputedRef<boolean>;
}

/** 与 WebKitLayout 一致的视口判断。在组件 setup 中调用，无需安装插件。 */
export function useWebKitViewport(): WebKitViewport {
  // setup/SSR 阶段不访问 window，挂载前保持 desktop，避免水合不一致。
  const mode = ref<ViewportMode>('desktop');
  let mobileMediaQuery: MediaQueryList | undefined;
  let tabletMediaQuery: MediaQueryList | undefined;

  function updateViewport() {
    mode.value = mobileMediaQuery?.matches
      ? 'mobile'
      : tabletMediaQuery?.matches
        ? 'tablet'
        : 'desktop';
  }

  onMounted(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }
    mobileMediaQuery = window.matchMedia('(max-width: 767px)');
    tabletMediaQuery = window.matchMedia(
      '(min-width: 768px) and (max-width: 1023px)',
    );
    updateViewport();
    mobileMediaQuery.addEventListener('change', updateViewport);
    tabletMediaQuery.addEventListener('change', updateViewport);
  });

  onBeforeUnmount(() => {
    mobileMediaQuery?.removeEventListener('change', updateViewport);
    tabletMediaQuery?.removeEventListener('change', updateViewport);
  });

  return Object.freeze({
    viewportMode: computed(() => mode.value),
    isMobile: computed(() => mode.value === 'mobile'),
    isTablet: computed(() => mode.value === 'tablet'),
    isDesktop: computed(() => mode.value === 'desktop'),
  });
}
